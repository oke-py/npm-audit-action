import * as core from '@actions/core'
import * as github from '@actions/github'
import { Octokit } from '@octokit/rest'
import { Audit } from './audit.js'
import { getInputs } from './inputs.js'
import type { IssueOption } from './interface.js'
import * as issue from './issue.js'
import { handlePullRequest } from './pr-flow.js'
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

    const inputs = getInputs()

    // run `npm audit`
    const audit = new Audit()
    audit.run(inputs.auditLevel, inputs.productionFlag, inputs.jsonFlag)
    core.info(audit.stdout)
    core.setOutput('npm_audit', audit.stdout)

    if (audit.foundVulnerability()) {
      // vulnerabilities are found

      // get GitHub information
      const octokit = new Octokit({
        auth: inputs.token
      })

      if (inputs.githubContext.event_name === 'pull_request') {
        await handlePullRequest(
          octokit,
          inputs.githubContext.event.number,
          audit.strippedStdout(),
          {
            createPRComments: inputs.createPRComments,
            failOnVulnerabilities: inputs.failOnVulnerabilities
          }
        )
        return
      }

      core.debug('open an issue')
      if (!inputs.createIssues) {
        if (inputs.failOnVulnerabilities) {
          core.setFailed('This repo has some vulnerabilities')
          return
        }
        core.info('This repo has some vulnerabilities')
        return
      }

      // remove control characters and create a code block
      const issueBody = audit.strippedStdout()
      const option: IssueOption = issue.getIssueOption(
        issueBody,
        inputs.issueTitle
      )

      const existingIssueNumber = inputs.dedupeIssues
        ? await issue.getExistingIssueNumber(
            octokit.issues.listForRepo,
            github.context.repo,
            inputs.issueTitle
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
      if (inputs.failOnVulnerabilities) {
        core.setFailed('This repo has some vulnerabilities')
        return
      }
      core.info('This repo has some vulnerabilities')
    }
  } catch (e: unknown) {
    core.setFailed((e as Error)?.message ?? 'Unknown error occurred')
  }
}
