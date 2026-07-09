import type { Octokit } from '@octokit/rest'
import { REPORT_MARKER, REPORT_MARKER_LENGTH } from './issue.js'

// Hidden marker appended to comments already edited by resolveComments so
// that they are not edited twice
export const RESOLVED_MARKER = '<!-- npm-audit-action:resolved -->'

function commitUrl(owner: string, repo: string, sha: string): string {
  return `https://github.com/${owner}/${repo}/commit/${sha}`
}

function buildResolvedBody(
  originalBody: string,
  owner: string,
  repo: string,
  headSha: string
): string {
  return `✅ npm audit no longer reports vulnerabilities as of [\`${headSha.slice(0, 7)}\`](${commitUrl(owner, repo, headSha)}).

<details><summary>Original report</summary>

${originalBody}

</details>

${RESOLVED_MARKER}`
}

// Length reserved when truncating the audit output so that the comment stays
// within the GitHub body length limit after the report marker is appended on
// posting and the resolved wrapper is added on a later edit. GitHub caps
// owners at 39 and repositories at 100 characters, so reserving for the
// longest possible commit URL is always enough.
export const RESOLVED_COMMENT_RESERVED_LENGTH =
  REPORT_MARKER_LENGTH +
  buildResolvedBody('', 'o'.repeat(39), 'r'.repeat(100), '0'.repeat(40)).length

export async function createComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<void> {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body
  })
}

export async function resolveComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  headSha: string
): Promise<number> {
  const unresolved: Array<{ id: number; body: string }> = []

  const perPage = 100
  for (let page = 1; ; page++) {
    const { data: comments } = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: prNumber,
      per_page: perPage,
      page
    })
    for (const comment of comments) {
      if (
        comment.body?.includes(REPORT_MARKER) &&
        !comment.body.includes(RESOLVED_MARKER)
      ) {
        unresolved.push({ id: comment.id, body: comment.body })
      }
    }
    if (comments.length < perPage) {
      break
    }
  }

  for (const comment of unresolved) {
    await octokit.issues.updateComment({
      owner,
      repo,
      comment_id: comment.id,
      body: buildResolvedBody(comment.body, owner, repo, headSha)
    })
  }

  return unresolved.length
}
