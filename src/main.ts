import * as core from '@actions/core'
import * as github from '@actions/github'
import stripAnsi from 'strip-ansi'
import Octokit, {IssuesCreateResponse} from '@octokit/rest'
import {Audit} from './audit'
import * as issue from './issue'
import {IssueOption} from './interface'

async function run(): Promise<void> {
  try {
    const audit = new Audit()
    audit.run()

    core.info(audit.stdout)

    if (!audit.foundVulnerability()) {
      // vulnerabilities are not found
      return
    }

    const context = JSON.parse(core.getInput('github_context'))
    core.debug(context.event_name)

    core.debug('open an issue')
    const token: string = core.getInput('token', {required: true})
    const client: Octokit = new github.GitHub(token)

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
