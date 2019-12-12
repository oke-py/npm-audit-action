import * as core from '@actions/core'
import * as github from '@actions/github'
import stripAnsi from 'strip-ansi'
import Octokit, {IssuesCreateResponse} from '@octokit/rest'
import {Audit} from './audit'
import * as issue from './issue'
import {IssueOption} from './interface'

async function run(): Promise<void> {
  try {
    const ctx = JSON.parse(core.getInput('github_context'))
    const token: string = core.getInput('token', {required: true})
    const client: Octokit = new github.GitHub(token)
    core.info(`event_name ${ctx.event_name}`)

    if (ctx.event_name === 'pull_request') {
      client.pulls.createComment({
        ...github.context.repo,
        pull_number: ctx.event.number,
        body: 'Hello',
        commit_id: ctx.sha,
        path: ''
      })
    }

    const audit = new Audit()
    audit.run()

    core.info(audit.stdout)

    if (!audit.foundVulnerability()) {
      // vulnerabilities are not found
      return
    }

    core.debug('open an issue')
    // remove control characters and create a code block
    const issueBody = `\`\`\`\n${stripAnsi(audit.stdout)}\n\`\`\``
    const option: IssueOption = issue.getIssueOption(issueBody)
    const {
      data: createdIssue
    }: Octokit.Response<IssuesCreateResponse> = await client.issues.create({
      ...github.context.repo,
      ...option
    })
    core.debug(`#${createdIssue.number}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
