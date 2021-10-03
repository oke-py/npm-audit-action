import * as fs from 'fs'
import * as path from 'path'
import {Octokit} from '@octokit/rest'
import {mocked} from 'ts-jest/utils'
import {Audit} from '../src/audit'
import {run} from '../src/main'
import * as issue from '../src/issue'
import * as pr from '../src/pr'

jest.mock('../src/audit')
jest.mock('../src/issue')
jest.mock('../src/pr')

describe('run: pr', () => {
  beforeEach(() => {
    // initialize mock
    mocked(Audit).mockClear()
    mocked(pr).createComment.mockClear()

    process.env.INPUT_AUDIT_LEVEL = 'low'
    process.env.INPUT_PRODUCTION_FLAG = 'false'
    process.env.INPUT_JSON_FLAG = 'false'
    process.env.INPUT_GITHUB_CONTEXT =
      '{ "event_name": "pull_request", "event": { "number": 100} }'
    process.env.INPUT_GITHUB_TOKEN = '***'
    process.env.GITHUB_REPOSITORY = 'alice/example'
    process.env.INPUT_CREATE_PR_COMMENTS = 'true'
  })

  test('does not call pr.createComment if vulnerabilities are not found', () => {
    mocked(Audit).mockImplementation((): any => {
      return {
        stdout: fs.readFileSync(
          path.join(__dirname, 'testdata/audit/success.txt')
        ),
        status: 0,
        run: (auditLevel: string): Promise<void> => {
          return Promise.resolve(void 0)
        },
        foundVulnerability: (): boolean => {
          return false
        },
        strippedStdout: (): string => {
          return path.join(__dirname, 'testdata/audit/success.txt')
        }
      }
    })

    mocked(pr).createComment.mockResolvedValue({
      config: {},
      headers: {},
      status: 201,
      statusText: 'Created',
      data: {
        value: []
      }
    })

    expect(run).not.toThrowError()
    expect(pr.createComment).not.toHaveBeenCalled()
  })

  test('calls pr.createComment if vulnerabilities are found in PR', () => {
    mocked(Audit).mockImplementation((): any => {
      return {
        stdout: fs.readFileSync(
          path.join(__dirname, 'testdata/audit/error.txt')
        ),
        status: 1,
        run: (auditLevel: string): Promise<void> => {
          return Promise.resolve(void 0)
        },
        foundVulnerability: (): boolean => {
          return true
        },
        strippedStdout: (): string => {
          return path.join(__dirname, 'testdata/audit/error.txt')
        }
      }
    })

    mocked(pr).createComment.mockResolvedValue({
      config: {},
      headers: {},
      status: 201,
      statusText: 'Created',
      data: {
        value: []
      }
    })

    expect(run).not.toThrowError()
    expect(pr.createComment).toHaveBeenCalled()
  })

  test('does not call pr.createComment if create_pr_comments is set to false', () => {
    process.env.INPUT_CREATE_PR_COMMENTS = 'false'

    mocked(Audit).mockImplementation((): any => {
      return {
        stdout: fs.readFileSync(
          path.join(__dirname, 'testdata/audit/error.txt')
        ),
        status: 1,
        run: (auditLevel: string): Promise<void> => {
          return Promise.resolve(void 0)
        },
        foundVulnerability: (): boolean => {
          return true
        },
        strippedStdout: (): string => {
          return path.join(__dirname, 'testdata/audit/error.txt')
        }
      }
    })

    expect(run).not.toThrowError()
    expect(pr.createComment).not.toHaveBeenCalled()
  })
})

describe('run: issue', () => {
  beforeEach(() => {
    // initialize mock
    mocked(Audit).mockClear()
    mocked(issue).getExistingIssueNumber.mockClear()

    process.env.INPUT_AUDIT_LEVEL = 'low'
    process.env.INPUT_PRODUCTION_FLAG = 'false'
    process.env.INPUT_JSON_FLAG = 'false'
    process.env.INPUT_GITHUB_CONTEXT = '{ "event_name": "push" }'
    process.env.INPUT_GITHUB_TOKEN = '***'
    process.env.GITHUB_REPOSITORY = 'alice/example'
    process.env.INPUT_CREATE_ISSUES = 'true'
    process.env.INPUT_DEDUPE_ISSUES = 'true'
  })

  test('does not call octokit.issues.create if create_issues is set to false', () => {
    process.env.INPUT_CREATE_ISSUES = 'false'

    mocked(Audit).mockImplementation((): any => {
      return {
        stdout: fs.readFileSync(
          path.join(__dirname, 'testdata/audit/error.txt')
        ),
        status: 1,
        run: (auditLevel: string): Promise<void> => {
          return Promise.resolve(void 0)
        },
        foundVulnerability: (): boolean => {
          return true
        },
        strippedStdout: (): string => {
          return path.join(__dirname, 'testdata/audit/error.txt')
        }
      }
    })

    mocked(issue).getExistingIssueNumber.mockResolvedValue(null)

    expect(run).not.toThrowError()
    expect(issue.getExistingIssueNumber).not.toHaveBeenCalled()
  })
})
