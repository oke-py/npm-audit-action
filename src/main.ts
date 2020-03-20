import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'
import {Audit} from './audit'
import {IssueOption} from './interface'
import * as issue from './issue'
import * as pr from './pr'

export async function run(): Promise<void> {
  try {
    // get audit-level
    const auditLevel = core.getInput('audit_level', {required: true})
    if (!['critical', 'high', 'moderate', 'low'].includes(auditLevel)) {
      throw new Error('Invalid input: audit_level')
    }

    // run `npm audit`
    const audit = new Audit()
    audit.run(auditLevel)
    core.info(audit.stdout)

    if (audit.foundVulnerability()) {
      // vulnerabilities are found

      // get GitHub information
      const ctx = JSON.parse(core.getInput('github_context'))
      const token: string = core.getInput('github_token', {required: true})
      const octokit = new github.GitHub(token)

      if (ctx.event_name === 'pull_request') {
        await pr.createComment(
          token,
          github.context.repo.owner,
          github.context.repo.repo,
          ctx.event.number,
          audit.strippedStdout()
        )
        core.setFailed('This repo has some vulnerabilities')
        return
      } else {
        core.debug('open an issue')
        // remove control characters and create a code block
        const issueBody = audit.strippedStdout()
        const option: IssueOption = issue.getIssueOption(issueBody)
        const {
          data: createdIssue
        }: Octokit.Response<Octokit.IssuesCreateResponse> = await octokit.issues.create(
          {
            ...github.context.repo,
            ...option
          }
        )
        core.debug(`#${createdIssue.number}`)
        core.setFailed('This repo has some vulnerabilities')
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
