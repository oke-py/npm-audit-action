import * as core from '@actions/core'
import * as github from '@actions/github'
import stripAnsi from 'strip-ansi'
import Octokit, {IssuesCreateResponse} from '@octokit/rest'
import {Audit} from './audit'

async function run(): Promise<void> {
  try {
    const audit = new Audit()
    audit.run()

    core.info(audit.stdout)

    if (!audit.foundVulnerability()) {
      // vulnerabilities are not found
      return
    }

    core.debug('open an issue')
    const token: string = core.getInput('token', {required: true})
    const client: Octokit = new github.GitHub(token)

    // remove control characters and create a code block
    const issueBody = `\`\`\`\n${stripAnsi(audit.stdout)}\n\`\`\``
    const issueOptions = {
      title: core.getInput('issue_title'),
      body: issueBody,
      assignees: core
        .getInput('issue_assignees')
        .replace(/\s+/g, '')
        .split(','),
      labels: core
        .getInput('issue_labels')
        .replace(/\s+/g, '')
        .split(',')
    }
    const {
      data: issue
    }: Octokit.Response<IssuesCreateResponse> = await client.issues.create({
      ...github.context.repo,
      ...issueOptions
    })
    core.debug(`#${issue.number}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
