import * as core from '../__fixtures__/core'
import * as issue from '../src/issue'
import * as pr from '../src/pr'
import { handlePullRequest, resolvePullRequestComments } from '../src/pr-flow'

vi.mock('@actions/core', () => core)
vi.mock('../src/pr')

describe('handlePullRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GITHUB_REPOSITORY = 'alice/example'
  })

  test('creates a PR comment when enabled', async () => {
    const octokit = {
      issues: {
        createComment: vi.fn()
      }
    }

    await handlePullRequest(octokit as never, 123, 'audit body', {
      createPRComments: true,
      resolvePRComments: false,
      failOnVulnerabilities: false
    })

    expect(pr.createComment).toHaveBeenCalledWith(
      octokit,
      'alice',
      'example',
      123,
      'audit body'
    )
    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith('This repo has some vulnerabilities')
  })

  test('appends the report marker when resolvePRComments is enabled', async () => {
    const octokit = {
      issues: {
        createComment: vi.fn()
      }
    }

    await handlePullRequest(octokit as never, 123, 'audit body', {
      createPRComments: true,
      resolvePRComments: true,
      failOnVulnerabilities: false
    })

    expect(pr.createComment).toHaveBeenCalledWith(
      octokit,
      'alice',
      'example',
      123,
      issue.appendReportMarker('audit body')
    )
  })

  test('skips PR comment when disabled', async () => {
    const octokit = {
      issues: {
        createComment: vi.fn()
      }
    }

    await handlePullRequest(octokit as never, 123, 'audit body', {
      createPRComments: false,
      resolvePRComments: false,
      failOnVulnerabilities: false
    })

    expect(pr.createComment).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith('This repo has some vulnerabilities')
  })

  test('fails when failOnVulnerabilities is true', async () => {
    const octokit = {
      issues: {
        createComment: vi.fn()
      }
    }

    await handlePullRequest(octokit as never, 123, 'audit body', {
      createPRComments: true,
      resolvePRComments: false,
      failOnVulnerabilities: true
    })

    expect(pr.createComment).toHaveBeenCalled()
    expect(core.setFailed).toHaveBeenCalledWith(
      'This repo has some vulnerabilities'
    )
    expect(core.info).not.toHaveBeenCalled()
  })
})

describe('resolvePullRequestComments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GITHUB_REPOSITORY = 'alice/example'
  })

  test('resolves comments and logs the count', async () => {
    const octokit = {
      issues: {
        listComments: vi.fn(),
        updateComment: vi.fn()
      }
    }
    vi.mocked(pr.resolveComments).mockResolvedValue(2)

    await resolvePullRequestComments(octokit as never, 123, 'headsha')

    expect(pr.resolveComments).toHaveBeenCalledWith(
      octokit,
      'alice',
      'example',
      123,
      'headsha'
    )
    expect(core.info).toHaveBeenCalledWith(
      'Marked 2 report comment(s) on PR #123 as resolved'
    )
  })

  test('does not log when there is nothing to resolve', async () => {
    const octokit = {
      issues: {
        listComments: vi.fn(),
        updateComment: vi.fn()
      }
    }
    vi.mocked(pr.resolveComments).mockResolvedValue(0)

    await resolvePullRequestComments(octokit as never, 123, 'headsha')

    expect(core.info).not.toHaveBeenCalled()
  })
})
