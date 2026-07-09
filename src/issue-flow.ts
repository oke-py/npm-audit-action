import * as core from '@actions/core'
import * as github from '@actions/github'
import type { Octokit } from '@octokit/rest'
import type { IssueOption } from './interface.js'
import * as issue from './issue.js'

type IssueFlowOptions = {
  createIssues: boolean
  dedupeIssues: boolean
  dedupeComments: boolean
  failOnVulnerabilities: boolean
  issueTitle: string
  issueAssignees?: string[]
  issueLabels?: string[]
  issueType?: string
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

  const body = options.dedupeComments
    ? issue.appendReportMarker(auditOutput)
    : auditOutput

  const option: IssueOption = {
    title: options.issueTitle,
    body,
    assignees: options.issueAssignees,
    labels: options.issueLabels,
    type: options.issueType
  }

  const existingIssue = options.dedupeIssues
    ? await issue.getExistingIssue(
        octokit.issues.listForRepo,
        github.context.repo,
        options.issueTitle
      )
    : null

  if (existingIssue !== null) {
    const unchanged =
      options.dedupeComments &&
      (await issue.isReportUnchanged(
        octokit.issues.listComments,
        github.context.repo,
        existingIssue,
        body
      ))
    if (unchanged) {
      core.info(
        `The report is unchanged. Skip commenting on issue #${existingIssue.number}`
      )
    } else {
      const { data: createdComment } = await octokit.issues.createComment({
        ...github.context.repo,
        issue_number: existingIssue.number,
        body
      })
      core.debug(`comment ${createdComment.url}`)
    }
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
