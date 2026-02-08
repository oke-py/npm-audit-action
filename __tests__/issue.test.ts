import type { IssueOption } from '../src/interface'
import * as issue from '../src/issue'

describe('getIssueOption', () => {
  test('without assignee and label', () => {
    process.env.INPUT_ISSUE_TITLE = 'npm audit found vulnerabilities'

    const expected: IssueOption = {
      title: 'npm audit found vulnerabilities',
      body: 'hi',
      assignees: undefined,
      labels: undefined
    }
    expect(issue.getIssueOption('hi')).toEqual(expected)
  })

  test('with 1 assignee and 1 label', () => {
    process.env.INPUT_ISSUE_TITLE = 'npm audit found vulnerabilities'
    process.env.INPUT_ISSUE_ASSIGNEES = 'alice'
    process.env.INPUT_ISSUE_LABELS = 'foo'

    const expected: IssueOption = {
      title: 'npm audit found vulnerabilities',
      body: 'hi',
      assignees: ['alice'],
      labels: ['foo']
    }
    expect(issue.getIssueOption('hi')).toEqual(expected)
  })

  test('with 2 assignees and 2 labels', () => {
    process.env.INPUT_ISSUE_TITLE = 'npm audit found vulnerabilities'
    process.env.INPUT_ISSUE_ASSIGNEES = 'alice,bob'
    process.env.INPUT_ISSUE_LABELS = 'foo,bar'

    const expected: IssueOption = {
      title: 'npm audit found vulnerabilities',
      body: 'hi',
      assignees: ['alice', 'bob'],
      labels: ['foo', 'bar']
    }
    expect(issue.getIssueOption('hi')).toEqual(expected)
  })

  test('with label containing spaces', () => {
    process.env.INPUT_ISSUE_TITLE = 'npm audit found vulnerabilities'
    process.env.INPUT_ISSUE_ASSIGNEES = 'alice'
    process.env.INPUT_ISSUE_LABELS = 'status: ready, work: frontend'

    const expected: IssueOption = {
      title: 'npm audit found vulnerabilities',
      body: 'hi',
      assignees: ['alice'],
      labels: ['status: ready', 'work: frontend']
    }
    expect(issue.getIssueOption('hi')).toEqual(expected)
  })
})

describe('getExistingIssueNumber', () => {
  const expectedTitle = 'expected title'
  const expectedIssueNumber = 12345
  const repo = 'testRepo'
  const owner = 'testOwner'

  beforeEach(() => {
    process.env.INPUT_ISSUE_TITLE = expectedTitle
  })

  test('gets existing open issue', async () => {
    const getIssues = vi.fn()
    getIssues.mockResolvedValue({
      data: [
        {
          title: expectedTitle,
          number: expectedIssueNumber
        }
      ]
    })
    const result = await issue.getExistingIssueNumber(getIssues, {
      repo,
      owner
    })

    expect(getIssues).toHaveBeenCalledWith({
      repo,
      owner,
      state: 'open'
    })

    expect(result).toBe(expectedIssueNumber)
  })

  test('returns null when there is no open issue', async () => {
    const getIssues = vi.fn()
    getIssues.mockResolvedValue({ data: [] })

    const result = await issue.getExistingIssueNumber(getIssues, {
      repo,
      owner
    })

    expect(getIssues).toHaveBeenCalledWith({
      repo,
      owner,
      state: 'open'
    })

    expect(result).toBe(null)
  })

  test('returns null when no issues match the issue title', async () => {
    const getIssues = vi.fn()
    getIssues.mockResolvedValue({
      data: [
        {
          title: 'some random other issue',
          number: 54321
        }
      ]
    })

    const result = await issue.getExistingIssueNumber(getIssues, {
      repo,
      owner
    })

    expect(getIssues).toHaveBeenCalledWith({
      repo,
      owner,
      state: 'open'
    })

    expect(result).toBe(null)
  })
})
