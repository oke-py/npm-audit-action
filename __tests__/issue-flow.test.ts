import * as core from '../__fixtures__/core'
import * as issue from '../src/issue'
import { handleIssueFlow } from '../src/issue-flow'

vi.mock('@actions/core', () => core)
vi.mock('../src/issue')

describe('handleIssueFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GITHUB_REPOSITORY = 'alice/example'
  })

  test('returns early when createIssues is false', async () => {
    const octokit = {
      issues: {
        create: vi.fn(),
        createComment: vi.fn(),
        listForRepo: vi.fn()
      }
    }

    await handleIssueFlow(octokit as never, 'audit body', {
      createIssues: false,
      dedupeIssues: true,
      failOnVulnerabilities: false,
      issueTitle: 'title'
    })

    expect(issue.getIssueOption).not.toHaveBeenCalled()
    expect(octokit.issues.create).not.toHaveBeenCalled()
    expect(octokit.issues.createComment).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith('This repo has some vulnerabilities')
  })

  test('creates issue when no existing issue is found', async () => {
    const octokit = {
      issues: {
        create: vi.fn().mockResolvedValue({ data: { number: 10 } }),
        createComment: vi.fn(),
        listForRepo: vi.fn()
      }
    }

    vi.mocked(issue.getIssueOption).mockReturnValue({
      title: 'title',
      body: 'body',
      assignees: undefined,
      labels: undefined
    })
    vi.mocked(issue.getExistingIssueNumber).mockResolvedValue(null)

    await handleIssueFlow(octokit as never, 'audit body', {
      createIssues: true,
      dedupeIssues: true,
      failOnVulnerabilities: false,
      issueTitle: 'title'
    })

    expect(issue.getExistingIssueNumber).toHaveBeenCalled()
    expect(octokit.issues.create).toHaveBeenCalledWith({
      owner: 'alice',
      repo: 'example',
      title: 'title',
      body: 'body',
      assignees: undefined,
      labels: undefined
    })
  })

  test('comments on existing issue when dedupe finds one', async () => {
    const octokit = {
      issues: {
        create: vi.fn(),
        createComment: vi.fn().mockResolvedValue({ data: { url: 'url' } }),
        listForRepo: vi.fn()
      }
    }

    vi.mocked(issue.getIssueOption).mockReturnValue({
      title: 'title',
      body: 'body',
      assignees: undefined,
      labels: undefined
    })
    vi.mocked(issue.getExistingIssueNumber).mockResolvedValue(99)

    await handleIssueFlow(octokit as never, 'audit body', {
      createIssues: true,
      dedupeIssues: true,
      failOnVulnerabilities: false,
      issueTitle: 'title'
    })

    expect(octokit.issues.createComment).toHaveBeenCalledWith({
      owner: 'alice',
      repo: 'example',
      issue_number: 99,
      body: 'body'
    })
  })

  test('fails when failOnVulnerabilities is true', async () => {
    const octokit = {
      issues: {
        create: vi.fn().mockResolvedValue({ data: { number: 10 } }),
        createComment: vi.fn(),
        listForRepo: vi.fn()
      }
    }

    vi.mocked(issue.getIssueOption).mockReturnValue({
      title: 'title',
      body: 'body',
      assignees: undefined,
      labels: undefined
    })
    vi.mocked(issue.getExistingIssueNumber).mockResolvedValue(null)

    await handleIssueFlow(octokit as never, 'audit body', {
      createIssues: true,
      dedupeIssues: false,
      failOnVulnerabilities: true,
      issueTitle: 'title'
    })

    expect(core.setFailed).toHaveBeenCalledWith(
      'This repo has some vulnerabilities'
    )
  })
})
