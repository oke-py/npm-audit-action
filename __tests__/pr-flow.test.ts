import * as core from '../__fixtures__/core'
import { handlePullRequest } from '../src/pr-flow'
import * as pr from '../src/pr'

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

  test('skips PR comment when disabled', async () => {
    const octokit = {
      issues: {
        createComment: vi.fn()
      }
    }

    await handlePullRequest(octokit as never, 123, 'audit body', {
      createPRComments: false,
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
      failOnVulnerabilities: true
    })

    expect(pr.createComment).toHaveBeenCalled()
    expect(core.setFailed).toHaveBeenCalledWith(
      'This repo has some vulnerabilities'
    )
    expect(core.info).not.toHaveBeenCalled()
  })
})
