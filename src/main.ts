import * as core from '@actions/core'
import * as github from '@actions/github'
import { Octokit } from '@octokit/rest'
import { Audit } from './audit.js'
import type { IssueOption } from './interface.js'
import * as issue from './issue.js'
import * as pr from './pr.js'
import * as workdir from './workdir.js'

export async function run(): Promise<void> {
  try {
    // move to working directory
    const workingDirectory = workdir.getNormalizedWorkingDirectory(
      core.getInput
    )
    if (workingDirectory) {
      try {
        // Try to change directory
        process.chdir(workingDirectory)
        core.info(`Successfully changed directory to: ${workingDirectory}`)
      } catch (error) {
        // If changing directory fails, log the error but continue
        core.warning(`Failed to change directory to: ${workingDirectory}`)
        core.warning(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        )
        core.warning('Continuing with current directory')
      }
    }
    core.info(`Current working directory: ${process.cwd()}`)

    // get audit-level
    const auditLevel = core.getInput('audit_level', { trimWhitespace: true })
    if (
      !['critical', 'high', 'moderate', 'low', 'info', 'none'].includes(
        auditLevel
      )
    ) {
      throw new Error('Invalid input: audit_level')
    }

    const productionFlag = core.getBooleanInput('production_flag')
    const jsonFlag = core.getBooleanInput('json_flag')

    // run `npm audit`
    const audit = new Audit()
    audit.run(auditLevel, productionFlag, jsonFlag)
    core.info(audit.stdout)
    core.setOutput('npm_audit', audit.stdout)

    if (audit.foundVulnerability()) {
      // vulnerabilities are found

      const failOnVulnerabilities = core.getBooleanInput(
        'fail_on_vulnerabilities'
      )

      // get GitHub information
      const ctx = JSON.parse(
        core.getInput('github_context', { trimWhitespace: true })
      )
      const token: string = core.getInput('github_token', {
        required: true,
        trimWhitespace: true
      })
      const octokit = new Octokit({
        auth: token
      })

      if (ctx.event_name === 'pull_request') {
        const createPRComments = core.getBooleanInput('create_pr_comments')

        if (createPRComments) {
          await pr.createComment(
            octokit,
            github.context.repo.owner,
            github.context.repo.repo,
            ctx.event.number,
            audit.strippedStdout()
          )
        }
        if (failOnVulnerabilities) {
          core.setFailed('This repo has some vulnerabilities')
          return
        }
        core.info('This repo has some vulnerabilities')
        return
      }

      core.debug('open an issue')
      const createIssues = core.getBooleanInput('create_issues')

      if (!createIssues) {
        if (failOnVulnerabilities) {
          core.setFailed('This repo has some vulnerabilities')
          return
        }
        core.info('This repo has some vulnerabilities')
        return
      }

      // remove control characters and create a code block
      const issueBody = audit.strippedStdout()
      const issueTitle = core.getInput('issue_title', { trimWhitespace: true })
      const option: IssueOption = issue.getIssueOption(issueBody, issueTitle)

      const existingIssueNumber = core.getBooleanInput('dedupe_issues')
        ? await issue.getExistingIssueNumber(
            octokit.issues.listForRepo,
            github.context.repo,
            issueTitle
          )
        : null

      if (existingIssueNumber !== null) {
        const { data: createdComment } = await octokit.issues.createComment({
          ...github.context.repo,
          issue_number: existingIssueNumber,
          body: option.body
        })
        core.debug(`comment ${createdComment.url}`)
      } else {
        const { data: createdIssue } = await octokit.issues.create({
          ...github.context.repo,
          ...option
        })
        core.debug(`#${createdIssue.number}`)
      }
      if (failOnVulnerabilities) {
        core.setFailed('This repo has some vulnerabilities')
        return
      }
      core.info('This repo has some vulnerabilities')
    }
  } catch (e: unknown) {
    core.setFailed((e as Error)?.message ?? 'Unknown error occurred')
  }
}
