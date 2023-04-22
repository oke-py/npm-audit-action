import {Octokit} from '@octokit/rest'

export async function createComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<void> {
  octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body
  })
}
