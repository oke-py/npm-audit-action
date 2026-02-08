import * as core from '@actions/core'
import * as github from '@actions/github'
import type { Octokit } from '@octokit/rest'
import type { IssueOption } from './interface.js'
import * as issue from './issue.js'

type IssueFlowOptions = {
  createIssues: boolean
  dedupeIssues: boolean
  failOnVulnerabilities: boolean
  issueTitle: string
}

export async function handleIssueFlow(
  octokit: Octokit,
  auditOutput: string,
  options: IssueFlowOptions
): Promise<void> {
  if (!options.createIssues) {
    if (options.failOnVulnerabilities) {
      core.setFailed('This repo has some vulnerabilities')
      return
    }
    core.info('This repo has some vulnerabilities')
    return
  }

  // remove control characters and create a code block
  const option: IssueOption = issue.getIssueOption(
    auditOutput,
    options.issueTitle
  )

  const existingIssueNumber = options.dedupeIssues
    ? await issue.getExistingIssueNumber(
        octokit.issues.listForRepo,
        github.context.repo,
        options.issueTitle
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
  if (options.failOnVulnerabilities) {
    core.setFailed('This repo has some vulnerabilities')
    return
  }
  core.info('This repo has some vulnerabilities')
}
