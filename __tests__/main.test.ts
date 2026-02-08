import * as fs from 'node:fs'
import * as path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as core from '../__fixtures__/core'
import { Audit } from '../src/audit'
import * as issue from '../src/issue'
import { run } from '../src/main'
import * as pr from '../src/pr'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Mocks should be declared before the module being tested is imported.
vi.mock('@actions/core', () => core)
vi.mock('../src/audit')
vi.mock('../src/issue')
vi.mock('../src/pr')
vi.mock('@octokit/rest', () => {
  return {
    Octokit: vi.fn().mockImplementation(function () {
      return {
        issues: {
          listForRepo: vi.fn(),
          createComment: vi.fn(),
          create: vi.fn()
        }
      }
    })
  }
})

describe('run: pr', () => {
  beforeEach(() => {
    // initialize mock
    vi.mocked(Audit).mockClear()
    vi.mocked(pr).createComment.mockClear()

    process.env.INPUT_AUDIT_LEVEL = 'low'
    process.env.INPUT_PRODUCTION_FLAG = 'false'
    process.env.INPUT_JSON_FLAG = 'false'
    process.env.INPUT_GITHUB_CONTEXT =
      '{ "event_name": "pull_request", "event": { "number": 100} }'
    process.env.INPUT_GITHUB_TOKEN = '***'
    process.env.GITHUB_REPOSITORY = 'alice/example'
    process.env.INPUT_CREATE_PR_COMMENTS = 'true'
    process.env.INPUT_CREATE_ISSUES = 'true'
    process.env.INPUT_DEDUPE_ISSUES = 'false'
    process.env.INPUT_FAIL_ON_VULNERABILITIES = 'true'
  })

  test('does not call pr.createComment if vulnerabilities are not found', async () => {
    vi.mocked(Audit).mockImplementation(function (): unknown {
      return {
        stdout: fs
          .readFileSync(path.join(__dirname, 'testdata/audit/success.txt'))
          .toString(),
        run: (): Promise<void> => {
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

    vi.mocked(pr).createComment.mockResolvedValue()

    await run()
    expect(pr.createComment).not.toHaveBeenCalled()
  })

  test('calls pr.createComment if vulnerabilities are found in PR', async () => {
    vi.mocked(Audit).mockImplementation(function (): unknown {
      return {
        stdout: fs
          .readFileSync(path.join(__dirname, 'testdata/audit/error.txt'))
          .toString(),
        run: (): Promise<void> => {
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

    vi.mocked(pr).createComment.mockResolvedValue()

    await run()
    expect(pr.createComment).toHaveBeenCalled()
  })

  test('does not call pr.createComment if create_pr_comments is set to false', async () => {
    process.env.INPUT_CREATE_PR_COMMENTS = 'false'

    vi.mocked(Audit).mockImplementation(function (): unknown {
      return {
        stdout: fs
          .readFileSync(path.join(__dirname, 'testdata/audit/error.txt'))
          .toString(),
        run: (): Promise<void> => {
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

    await run()
    expect(pr.createComment).not.toHaveBeenCalled()
  })
})

describe('run: issue', () => {
  beforeEach(() => {
    // initialize mock
    vi.mocked(Audit).mockClear()
    vi.mocked(issue).getExistingIssueNumber.mockClear()

    process.env.INPUT_AUDIT_LEVEL = 'low'
    process.env.INPUT_PRODUCTION_FLAG = 'false'
    process.env.INPUT_JSON_FLAG = 'false'
    process.env.INPUT_GITHUB_CONTEXT = '{ "event_name": "push" }'
    process.env.INPUT_GITHUB_TOKEN = '***'
    process.env.GITHUB_REPOSITORY = 'alice/example'
    process.env.INPUT_CREATE_ISSUES = 'true'
    process.env.INPUT_DEDUPE_ISSUES = 'true'
    process.env.INPUT_FAIL_ON_VULNERABILITIES = 'true'
  })

  test('does not call octokit.rest.issues.create if create_issues is set to false', async () => {
    process.env.INPUT_CREATE_ISSUES = 'false'

    vi.mocked(Audit).mockImplementation(function (): unknown {
      return {
        stdout: fs
          .readFileSync(path.join(__dirname, 'testdata/audit/error.txt'))
          .toString(),
        run: (): Promise<void> => {
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

    vi.mocked(issue).getExistingIssueNumber.mockResolvedValue(null)

    await run()
    expect(issue.getExistingIssueNumber).not.toHaveBeenCalled()
  })
})
