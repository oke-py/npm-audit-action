import * as issue from '../src/issue'
import {IssueOption} from '../src/interface'

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
})
