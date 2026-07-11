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
    vi.mocked(pr).resolveComments.mockClear()
    core.setFailed.mockClear()
    core.warning.mockClear()

    process.env.INPUT_AUDIT_LEVEL = 'low'
    process.env.INPUT_PRODUCTION_FLAG = 'false'
    process.env.INPUT_JSON_FLAG = 'false'
    delete process.env.INPUT_REPORT_FORMAT
    process.env.GITHUB_EVENT_NAME = 'pull_request'
    process.env.GITHUB_EVENT_PATH = path.join(
      __dirname,
      'testdata/event/pull_request.json'
    )
    process.env.INPUT_GITHUB_TOKEN = '***'
    process.env.GITHUB_REPOSITORY = 'alice/example'
    process.env.INPUT_CREATE_PR_COMMENTS = 'true'
    process.env.INPUT_RESOLVE_PR_COMMENTS = 'false'
    process.env.INPUT_CREATE_ISSUES = 'true'
    process.env.INPUT_DEDUPE_ISSUES = 'false'
    process.env.INPUT_DEDUPE_COMMENTS = 'false'
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

  test('forces --json and posts a markdown report when report_format is markdown', async () => {
    process.env.INPUT_REPORT_FORMAT = 'markdown'

    const runMock = vi.fn()
    vi.mocked(Audit).mockImplementation(function (): unknown {
      return {
        stdout: fs
          .readFileSync(path.join(__dirname, 'testdata/audit/error-v2.json'))
          .toString(),
        run: runMock,
        foundVulnerability: (): boolean => {
          return true
        },
        strippedStdout: (): string => {
          return 'text-report'
        }
      }
    })

    vi.mocked(pr).createComment.mockResolvedValue()

    await run()
    expect(runMock).toHaveBeenCalledWith('low', false, true, '')
    const body = vi.mocked(pr).createComment.mock.calls[0][4]
    expect(body).toContain('## npm audit report')
    expect(body).toContain('| lodash | high |')
    expect(core.warning).not.toHaveBeenCalled()
  })

  test('falls back to the text report when the markdown report cannot be built', async () => {
    process.env.INPUT_REPORT_FORMAT = 'markdown'

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
          return 'text-report'
        }
      }
    })

    vi.mocked(pr).createComment.mockResolvedValue()

    await run()
    const body = vi.mocked(pr).createComment.mock.calls[0][4]
    expect(body).toBe('text-report')
    expect(core.warning).toHaveBeenCalledWith(
      expect.stringContaining('posting the raw audit output')
    )
  })

  test('resolves previous comments when vulnerabilities are gone and resolve_pr_comments is enabled', async () => {
    process.env.INPUT_RESOLVE_PR_COMMENTS = 'true'

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

    vi.mocked(pr).resolveComments.mockResolvedValue(1)

    await run()
    expect(pr.createComment).not.toHaveBeenCalled()
    expect(pr.resolveComments).toHaveBeenCalledWith(
      expect.anything(),
      'alice',
      'example',
      100,
      '0123456789abcdef0123456789abcdef01234567'
    )
  })

  test('does not resolve comments when resolve_pr_comments is disabled', async () => {
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

    await run()
    expect(pr.resolveComments).not.toHaveBeenCalled()
  })

  test('fails if GITHUB_EVENT_PATH is not set', async () => {
    delete process.env.GITHUB_EVENT_PATH

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
    expect(core.setFailed).toHaveBeenCalledWith('GITHUB_EVENT_PATH is not set')
    expect(pr.createComment).not.toHaveBeenCalled()
  })

  test('fails if the event payload has no pull request number', async () => {
    process.env.GITHUB_EVENT_PATH = path.join(
      __dirname,
      'testdata/event/no_number.json'
    )

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
    expect(core.setFailed).toHaveBeenCalledWith(
      'Failed to read the pull request number from the event'
    )
    expect(pr.createComment).not.toHaveBeenCalled()
  })
})

describe('run: issue', () => {
  beforeEach(() => {
    // initialize mock
    vi.mocked(Audit).mockClear()
    vi.mocked(issue).getExistingIssue.mockClear()

    process.env.INPUT_AUDIT_LEVEL = 'low'
    process.env.INPUT_PRODUCTION_FLAG = 'false'
    process.env.INPUT_JSON_FLAG = 'false'
    delete process.env.INPUT_REPORT_FORMAT
    process.env.GITHUB_EVENT_NAME = 'push'
    delete process.env.GITHUB_EVENT_PATH
    process.env.INPUT_GITHUB_TOKEN = '***'
    process.env.GITHUB_REPOSITORY = 'alice/example'
    process.env.INPUT_CREATE_ISSUES = 'true'
    process.env.INPUT_DEDUPE_ISSUES = 'true'
    process.env.INPUT_DEDUPE_COMMENTS = 'false'
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

    vi.mocked(issue).getExistingIssue.mockResolvedValue(null)

    await run()
    expect(issue.getExistingIssue).not.toHaveBeenCalled()
  })
})
