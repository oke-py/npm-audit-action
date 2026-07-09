import * as core from '@actions/core'
import * as github from '@actions/github'
import type { Octokit } from '@octokit/rest'
import * as issue from './issue.js'
import * as pr from './pr.js'

type PullRequestOptions = {
  createPRComments: boolean
  resolvePRComments: boolean
  failOnVulnerabilities: boolean
}

export async function handlePullRequest(
  octokit: Octokit,
  prNumber: number,
  auditOutput: string,
  options: PullRequestOptions
): Promise<void> {
  if (options.createPRComments) {
    const body = options.resolvePRComments
      ? issue.appendReportMarker(auditOutput)
      : auditOutput
    await pr.createComment(
      octokit,
      github.context.repo.owner,
      github.context.repo.repo,
      prNumber,
      body
    )
  }

  if (options.failOnVulnerabilities) {
    core.setFailed('This repo has some vulnerabilities')
    return
  }

  core.info('This repo has some vulnerabilities')
}

export async function resolvePullRequestComments(
  octokit: Octokit,
  prNumber: number,
  headSha: string
): Promise<void> {
  const resolved = await pr.resolveComments(
    octokit,
    github.context.repo.owner,
    github.context.repo.repo,
    prNumber,
    headSha
  )
  if (resolved > 0) {
    core.info(
      `Marked ${resolved} report comment(s) on PR #${prNumber} as resolved`
    )
  }
}
