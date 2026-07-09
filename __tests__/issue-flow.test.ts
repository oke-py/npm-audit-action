import * as core from '../__fixtures__/core'
import * as issue from '../src/issue'
import { handleIssueFlow } from '../src/issue-flow'

vi.mock('@actions/core', () => core)
vi.mock('../src/issue')

describe('handleIssueFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GITHUB_REPOSITORY = 'alice/example'
    vi.mocked(issue.appendReportMarker).mockImplementation(
      (body) => `${body}\n\n<!-- marker -->`
    )
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
      dedupeComments: false,
      failOnVulnerabilities: false,
      issueTitle: 'title'
    })

    expect(issue.getExistingIssue).not.toHaveBeenCalled()
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

    vi.mocked(issue.getExistingIssue).mockResolvedValue(null)

    await handleIssueFlow(octokit as never, 'audit body', {
      createIssues: true,
      dedupeIssues: true,
      dedupeComments: false,
      failOnVulnerabilities: false,
      issueTitle: 'title',
      issueAssignees: ['alice'],
      issueLabels: ['security'],
      issueType: 'Bug'
    })

    expect(issue.getExistingIssue).toHaveBeenCalledWith(
      octokit.issues.listForRepo,
      { owner: 'alice', repo: 'example' },
      'title'
    )
    expect(octokit.issues.create).toHaveBeenCalledWith({
      owner: 'alice',
      repo: 'example',
      title: 'title',
      body: 'audit body',
      assignees: ['alice'],
      labels: ['security'],
      type: 'Bug'
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

    vi.mocked(issue.getExistingIssue).mockResolvedValue({
      number: 99,
      body: null
    })

    await handleIssueFlow(octokit as never, 'audit body', {
      createIssues: true,
      dedupeIssues: true,
      dedupeComments: false,
      failOnVulnerabilities: false,
      issueTitle: 'title'
    })

    expect(octokit.issues.createComment).toHaveBeenCalledWith({
      owner: 'alice',
      repo: 'example',
      issue_number: 99,
      body: 'audit body'
    })
    expect(octokit.issues.create).not.toHaveBeenCalled()
    expect(issue.isReportUnchanged).not.toHaveBeenCalled()
  })

  test('creates issue with marker when dedupeComments is enabled', async () => {
    const octokit = {
      issues: {
        create: vi.fn().mockResolvedValue({ data: { number: 10 } }),
        createComment: vi.fn(),
        listForRepo: vi.fn()
      }
    }

    vi.mocked(issue.getExistingIssue).mockResolvedValue(null)

    await handleIssueFlow(octokit as never, 'audit body', {
      createIssues: true,
      dedupeIssues: true,
      dedupeComments: true,
      failOnVulnerabilities: false,
      issueTitle: 'title'
    })

    expect(octokit.issues.create).toHaveBeenCalledWith({
      owner: 'alice',
      repo: 'example',
      title: 'title',
      body: 'audit body\n\n<!-- marker -->',
      assignees: undefined,
      labels: undefined,
      type: undefined
    })
  })

  test('comments with marker when dedupeComments is enabled and the report changed', async () => {
    const octokit = {
      issues: {
        create: vi.fn(),
        createComment: vi.fn().mockResolvedValue({ data: { url: 'url' } }),
        listComments: vi.fn(),
        listForRepo: vi.fn()
      }
    }

    vi.mocked(issue.getExistingIssue).mockResolvedValue({
      number: 99,
      body: null
    })
    vi.mocked(issue.isReportUnchanged).mockResolvedValue(false)

    await handleIssueFlow(octokit as never, 'audit body', {
      createIssues: true,
      dedupeIssues: true,
      dedupeComments: true,
      failOnVulnerabilities: false,
      issueTitle: 'title'
    })

    expect(issue.isReportUnchanged).toHaveBeenCalledWith(
      octokit.issues.listComments,
      { owner: 'alice', repo: 'example' },
      { number: 99, body: null },
      'audit body\n\n<!-- marker -->'
    )
    expect(octokit.issues.createComment).toHaveBeenCalledWith({
      owner: 'alice',
      repo: 'example',
      issue_number: 99,
      body: 'audit body\n\n<!-- marker -->'
    })
  })

  test('skips commenting when dedupeComments is enabled and the report is unchanged', async () => {
    const octokit = {
      issues: {
        create: vi.fn(),
        createComment: vi.fn(),
        listComments: vi.fn(),
        listForRepo: vi.fn()
      }
    }

    vi.mocked(issue.getExistingIssue).mockResolvedValue({
      number: 99,
      body: null
    })
    vi.mocked(issue.isReportUnchanged).mockResolvedValue(true)

    await handleIssueFlow(octokit as never, 'audit body', {
      createIssues: true,
      dedupeIssues: true,
      dedupeComments: true,
      failOnVulnerabilities: false,
      issueTitle: 'title'
    })

    expect(octokit.issues.createComment).not.toHaveBeenCalled()
    expect(octokit.issues.create).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledWith(
      'The report is unchanged. Skip commenting on issue #99'
    )
    expect(core.info).toHaveBeenCalledWith('This repo has some vulnerabilities')
  })

  test('still fails when the report is unchanged and failOnVulnerabilities is true', async () => {
    const octokit = {
      issues: {
        create: vi.fn(),
        createComment: vi.fn(),
        listComments: vi.fn(),
        listForRepo: vi.fn()
      }
    }

    vi.mocked(issue.getExistingIssue).mockResolvedValue({
      number: 99,
      body: null
    })
    vi.mocked(issue.isReportUnchanged).mockResolvedValue(true)

    await handleIssueFlow(octokit as never, 'audit body', {
      createIssues: true,
      dedupeIssues: true,
      dedupeComments: true,
      failOnVulnerabilities: true,
      issueTitle: 'title'
    })

    expect(octokit.issues.createComment).not.toHaveBeenCalled()
    expect(core.setFailed).toHaveBeenCalledWith(
      'This repo has some vulnerabilities'
    )
  })

  test('fails when failOnVulnerabilities is true', async () => {
    const octokit = {
      issues: {
        create: vi.fn().mockResolvedValue({ data: { number: 10 } }),
        createComment: vi.fn(),
        listForRepo: vi.fn()
      }
    }

    vi.mocked(issue.getExistingIssue).mockResolvedValue(null)

    await handleIssueFlow(octokit as never, 'audit body', {
      createIssues: true,
      dedupeIssues: false,
      dedupeComments: false,
      failOnVulnerabilities: true,
      issueTitle: 'title'
    })

    expect(core.setFailed).toHaveBeenCalledWith(
      'This repo has some vulnerabilities'
    )
  })
})
