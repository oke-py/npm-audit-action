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
    const workingDirectory = core.getInput('working_directory')
    if (workingDirectory) {
      // Remove trailing slash if present
      const normalizedWorkingDirectory = workingDirectory.endsWith('/')
        ? workingDirectory.slice(0, -1)
        : workingDirectory

      if (!workdir.isValid(normalizedWorkingDirectory)) {
        throw new Error('Invalid input: working_directory')
      }

      try {
        // Try to change directory
        process.chdir(normalizedWorkingDirectory)
        core.info(
          `Successfully changed directory to: ${normalizedWorkingDirectory}`
        )
      } catch (error) {
        // If changing directory fails, log the error but continue
        core.warning(
          `Failed to change directory to: ${normalizedWorkingDirectory}`
        )
        core.warning(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        )
        core.warning('Continuing with current directory')
      }
    }
    core.info(`Current working directory: ${process.cwd()}`)

    // get audit-level
    const auditLevel = core.getInput('audit_level', { required: true })
    if (
      !['critical', 'high', 'moderate', 'low', 'info', 'none'].includes(
        auditLevel
      )
    ) {
      throw new Error('Invalid input: audit_level')
    }

    const productionFlag = core.getInput('production_flag', { required: false })
    if (!['true', 'false'].includes(productionFlag)) {
      throw new Error('Invalid input: production_flag')
    }

    const jsonFlag = core.getInput('json_flag', { required: false })
    if (!['true', 'false'].includes(jsonFlag)) {
      throw new Error('Invalid input: json_flag')
    }

    // run `npm audit`
    const audit = new Audit()
    audit.run(auditLevel, productionFlag, jsonFlag)
    core.info(audit.stdout)
    core.setOutput('npm_audit', audit.stdout)

    if (audit.foundVulnerability()) {
      // vulnerabilities are found

      // get GitHub information
      const ctx = JSON.parse(core.getInput('github_context'))
      const token: string = core.getInput('github_token', { required: true })
      const octokit = new Octokit({
        auth: token
      })

      if (ctx.event_name === 'pull_request') {
        const createPRComments = core.getInput('create_pr_comments')
        if (!['true', 'false'].includes(createPRComments)) {
          throw new Error('Invalid input: create_pr_comments')
        }

        if (createPRComments === 'true') {
          await pr.createComment(
            octokit,
            github.context.repo.owner,
            github.context.repo.repo,
            ctx.event.number,
            audit.strippedStdout()
          )
        }
        core.setFailed('This repo has some vulnerabilities')
        return
      }

      core.debug('open an issue')
      const createIssues = core.getInput('create_issues')
      if (!['true', 'false'].includes(createIssues)) {
        throw new Error('Invalid input: create_issues')
      }

      if (createIssues === 'false') {
        core.setFailed('This repo has some vulnerabilities')
        return
      }

      // remove control characters and create a code block
      const issueBody = audit.strippedStdout()
      const option: IssueOption = issue.getIssueOption(issueBody)

      const existingIssueNumber =
        core.getInput('dedupe_issues') === 'true'
          ? await issue.getExistingIssueNumber(
              octokit.issues.listForRepo,
              github.context.repo
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
      core.setFailed('This repo has some vulnerabilities')
    }
  } catch (e: unknown) {
    core.setFailed((e as Error)?.message ?? 'Unknown error occurred')
  }
}
