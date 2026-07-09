import { Audit } from '../src/audit'
import * as issue from '../src/issue'
import * as pr from '../src/pr'

describe('createComment', () => {
  test('creates a comment on the pull request', async () => {
    const octokit = {
      issues: {
        createComment: vi.fn()
      }
    }

    await pr.createComment(octokit as never, 'alice', 'example', 123, 'body')

    expect(octokit.issues.createComment).toHaveBeenCalledWith({
      owner: 'alice',
      repo: 'example',
      issue_number: 123,
      body: 'body'
    })
  })
})

describe('resolveComments', () => {
  const headSha = '0123456789abcdef0123456789abcdef01234567'
  const reportBody = issue.appendReportMarker('audit report')

  test('edits unresolved report comments and returns the count', async () => {
    const octokit = {
      issues: {
        listComments: vi.fn().mockResolvedValue({
          data: [
            { id: 1, body: 'a human comment' },
            { id: 2, body: reportBody }
          ]
        }),
        updateComment: vi.fn()
      }
    }

    const resolved = await pr.resolveComments(
      octokit as never,
      'alice',
      'example',
      123,
      headSha
    )

    expect(octokit.issues.listComments).toHaveBeenCalledWith({
      owner: 'alice',
      repo: 'example',
      issue_number: 123,
      per_page: 100,
      page: 1
    })
    expect(octokit.issues.updateComment).toHaveBeenCalledTimes(1)
    const { comment_id, body } = octokit.issues.updateComment.mock.calls[0][0]
    expect(comment_id).toBe(2)
    expect(body).toContain(
      '✅ npm audit no longer reports vulnerabilities as of ' +
        '[`0123456`](https://github.com/alice/example/commit/' +
        `${headSha}).`
    )
    expect(body).toContain('<details><summary>Original report</summary>')
    expect(body).toContain(reportBody)
    expect(body).toContain('</details>')
    expect(body.endsWith(pr.RESOLVED_MARKER)).toBe(true)
    expect(resolved).toBe(1)
  })

  test('skips comments that are already resolved', async () => {
    const octokit = {
      issues: {
        listComments: vi.fn().mockResolvedValue({
          data: [{ id: 2, body: reportBody }]
        }),
        updateComment: vi.fn()
      }
    }

    // resolve the report once, then feed the edited body back in
    await pr.resolveComments(octokit as never, 'alice', 'example', 123, headSha)
    const resolvedBody = octokit.issues.updateComment.mock.calls[0][0].body
    octokit.issues.updateComment.mockClear()
    octokit.issues.listComments.mockResolvedValue({
      data: [{ id: 2, body: resolvedBody }]
    })

    const resolved = await pr.resolveComments(
      octokit as never,
      'alice',
      'example',
      123,
      headSha
    )

    expect(octokit.issues.updateComment).not.toHaveBeenCalled()
    expect(resolved).toBe(0)
  })

  test('returns 0 when the pull request has no comments', async () => {
    const octokit = {
      issues: {
        listComments: vi.fn().mockResolvedValue({ data: [] }),
        updateComment: vi.fn()
      }
    }

    const resolved = await pr.resolveComments(
      octokit as never,
      'alice',
      'example',
      123,
      headSha
    )

    expect(octokit.issues.updateComment).not.toHaveBeenCalled()
    expect(resolved).toBe(0)
  })

  test('paginates through comments', async () => {
    const fullPage = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      body: 'a human comment'
    }))
    const octokit = {
      issues: {
        listComments: vi
          .fn()
          .mockResolvedValueOnce({ data: fullPage })
          .mockResolvedValueOnce({ data: [{ id: 200, body: reportBody }] }),
        updateComment: vi.fn()
      }
    }

    const resolved = await pr.resolveComments(
      octokit as never,
      'alice',
      'example',
      123,
      headSha
    )

    expect(octokit.issues.listComments).toHaveBeenCalledTimes(2)
    expect(octokit.issues.listComments).toHaveBeenLastCalledWith({
      owner: 'alice',
      repo: 'example',
      issue_number: 123,
      per_page: 100,
      page: 2
    })
    expect(resolved).toBe(1)
  })

  test('keeps the resolved body within the GitHub limit for a truncated report', async () => {
    const a = new Audit()
    a.stdout = 'a'.repeat(100000)
    const postedBody = issue.appendReportMarker(
      a.strippedStdout(pr.RESOLVED_COMMENT_RESERVED_LENGTH)
    )
    const octokit = {
      issues: {
        listComments: vi
          .fn()
          .mockResolvedValue({ data: [{ id: 2, body: postedBody }] }),
        updateComment: vi.fn()
      }
    }

    await pr.resolveComments(octokit as never, 'alice', 'example', 123, headSha)

    const resolvedBody = octokit.issues.updateComment.mock.calls[0][0].body
    expect(resolvedBody.length).toBeLessThanOrEqual(65536)
  })
})
