import * as core from '@actions/core'
import * as github from '@actions/github'
import type { Octokit } from '@octokit/rest'
import * as pr from './pr.js'

type PullRequestOptions = {
  createPRComments: boolean
  failOnVulnerabilities: boolean
}

export async function handlePullRequest(
  octokit: Octokit,
  prNumber: number,
  auditOutput: string,
  options: PullRequestOptions
): Promise<void> {
  if (options.createPRComments) {
    await pr.createComment(
      octokit,
      github.context.repo.owner,
      github.context.repo.repo,
      prNumber,
      auditOutput
    )
  }

  if (options.failOnVulnerabilities) {
    core.setFailed('This repo has some vulnerabilities')
    return
  }

  core.info('This repo has some vulnerabilities')
}
