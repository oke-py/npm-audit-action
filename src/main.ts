import * as core from '@actions/core'
import * as github from '@actions/github'
import stripAnsi from 'strip-ansi'
import Octokit, {IssuesCreateResponse} from '@octokit/rest'
import {Audit} from './audit'
import * as issue from './issue'
import {IssueOption} from './interface'
import * as pr from './pr'

async function run(): Promise<void> {
  try {
    const ctx = JSON.parse(core.getInput('github_context'))
    const token: string = core.getInput('github_token', {required: true})
    const client: Octokit = new github.GitHub(token)
    core.info(`event_name ${ctx.event_name}`)

    if (ctx.event_name === 'pull_request') {
      const res = await pr.createComment(
        token,
        github.context.repo.owner,
        github.context.repo.repo,
        ctx.event.number,
        'Hello'
      )
      core.info(JSON.stringify(res))
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
