import * as core from '../__fixtures__/core'
import { getInputs } from '../src/inputs'

vi.mock('@actions/core', () => core)

describe('getInputs', () => {
  beforeEach(() => {
    process.env.INPUT_AUDIT_LEVEL = 'low'
    process.env.INPUT_PRODUCTION_FLAG = 'false'
    process.env.INPUT_JSON_FLAG = 'false'
    process.env.INPUT_FAIL_ON_VULNERABILITIES = 'false'
    process.env.INPUT_CREATE_PR_COMMENTS = 'true'
    process.env.INPUT_RESOLVE_PR_COMMENTS = 'false'
    process.env.INPUT_CREATE_ISSUES = 'true'
    process.env.INPUT_DEDUPE_ISSUES = 'false'
    process.env.INPUT_DEDUPE_COMMENTS = 'false'
    process.env.INPUT_ISSUE_TITLE = 'npm audit found vulnerabilities'
    process.env.INPUT_GITHUB_TOKEN = 'token'
    delete process.env.INPUT_REGISTRY
    delete process.env.INPUT_IGNORE_GHSAS
    delete process.env.INPUT_REPORT_FORMAT
    delete process.env.INPUT_ISSUE_ASSIGNEES
    delete process.env.INPUT_ISSUE_LABELS
    delete process.env.INPUT_ISSUE_TYPE
    delete process.env.INPUT_WORKING_DIRECTORY
  })

  test('returns normalized inputs', () => {
    process.env.INPUT_AUDIT_LEVEL = ' low '
    process.env.INPUT_ISSUE_TITLE = '  title '

    const inputs = getInputs()

    expect(inputs.auditLevel).toBe('low')
    expect(inputs.issueTitle).toBe('title')
  })

  test('parses dedupe_comments', () => {
    process.env.INPUT_DEDUPE_COMMENTS = 'true'

    expect(getInputs().dedupeComments).toBe(true)
  })

  test('parses resolve_pr_comments', () => {
    process.env.INPUT_RESOLVE_PR_COMMENTS = 'true'

    expect(getInputs().resolvePRComments).toBe(true)
  })

  test('throws on invalid audit_level', () => {
    process.env.INPUT_AUDIT_LEVEL = 'invalid'
    expect(() => getInputs()).toThrow('Invalid input: audit_level')
  })

  test('throws when github_token is missing', () => {
    process.env.INPUT_GITHUB_TOKEN = ''
    expect(() => getInputs()).toThrow('Input required and not supplied')
  })

  test('returns empty registry when not set', () => {
    expect(getInputs().registry).toBe('')
  })

  test('returns registry when it is a valid URL', () => {
    process.env.INPUT_REGISTRY = 'https://registry.npmjs.org'
    expect(getInputs().registry).toBe('https://registry.npmjs.org')
  })

  test('accepts a registry URL with port and path', () => {
    process.env.INPUT_REGISTRY = 'http://localhost:4873/npm'
    expect(getInputs().registry).toBe('http://localhost:4873/npm')
  })

  test('throws on registry that is not a URL', () => {
    process.env.INPUT_REGISTRY = 'not a url'
    expect(() => getInputs()).toThrow('Invalid input: registry')
  })

  test('throws on registry with a non-http protocol', () => {
    process.env.INPUT_REGISTRY = 'ftp://registry.npmjs.org'
    expect(() => getInputs()).toThrow('Invalid input: registry')
  })

  test('throws on registry containing shell metacharacters', () => {
    process.env.INPUT_REGISTRY = 'https://registry.npmjs.org/&whoami'
    expect(() => getInputs()).toThrow('Invalid input: registry')
  })

  test('returns an empty ignore list when not set', () => {
    expect(getInputs().ignoreGhsas).toEqual([])
  })

  test('parses comma-separated GHSA IDs', () => {
    process.env.INPUT_IGNORE_GHSAS = 'GHSA-35jh-r3h4-6jhm, GHSA-xvch-5gv4-984h'
    expect(getInputs().ignoreGhsas).toEqual([
      'GHSA-35jh-r3h4-6jhm',
      'GHSA-xvch-5gv4-984h'
    ])
  })

  test('parses newline-separated GHSA IDs', () => {
    process.env.INPUT_IGNORE_GHSAS = 'GHSA-35jh-r3h4-6jhm\nGHSA-xvch-5gv4-984h'
    expect(getInputs().ignoreGhsas).toEqual([
      'GHSA-35jh-r3h4-6jhm',
      'GHSA-xvch-5gv4-984h'
    ])
  })

  test('throws on an invalid GHSA ID', () => {
    process.env.INPUT_IGNORE_GHSAS = 'CVE-2024-12345'
    expect(() => getInputs()).toThrow(
      'Invalid input: ignore_ghsas contains an invalid GHSA ID: CVE-2024-12345'
    )
  })

  test('defaults report_format to text when not set', () => {
    expect(getInputs().reportFormat).toBe('text')
  })

  test('parses report_format markdown', () => {
    process.env.INPUT_REPORT_FORMAT = 'markdown'
    expect(getInputs().reportFormat).toBe('markdown')
  })

  test('throws on invalid report_format', () => {
    process.env.INPUT_REPORT_FORMAT = 'html'
    expect(() => getInputs()).toThrow('Invalid input: report_format')
  })

  test('returns undefined assignees, labels, and type when not set', () => {
    const inputs = getInputs()

    expect(inputs.issueAssignees).toBeUndefined()
    expect(inputs.issueLabels).toBeUndefined()
    expect(inputs.issueType).toBeUndefined()
  })

  test('parses a single assignee and label', () => {
    process.env.INPUT_ISSUE_ASSIGNEES = 'alice'
    process.env.INPUT_ISSUE_LABELS = 'foo'

    const inputs = getInputs()

    expect(inputs.issueAssignees).toEqual(['alice'])
    expect(inputs.issueLabels).toEqual(['foo'])
  })

  test('parses comma-separated assignees and labels', () => {
    process.env.INPUT_ISSUE_ASSIGNEES = 'alice,bob'
    process.env.INPUT_ISSUE_LABELS = 'foo,bar'

    const inputs = getInputs()

    expect(inputs.issueAssignees).toEqual(['alice', 'bob'])
    expect(inputs.issueLabels).toEqual(['foo', 'bar'])
  })

  test('keeps spaces inside labels while trimming around commas', () => {
    process.env.INPUT_ISSUE_LABELS = 'status: ready, work: frontend'

    expect(getInputs().issueLabels).toEqual(['status: ready', 'work: frontend'])
  })

  test('returns issue type when set', () => {
    process.env.INPUT_ISSUE_TYPE = 'Bug'

    expect(getInputs().issueType).toBe('Bug')
  })

  test('returns null working directory when not set', () => {
    expect(getInputs().workingDirectory).toBeNull()
  })

  test('normalizes the working directory', () => {
    process.env.INPUT_WORKING_DIRECTORY = 'packages/app/'

    expect(getInputs().workingDirectory).toBe('packages/app')
  })

  test('throws on invalid working directory', () => {
    process.env.INPUT_WORKING_DIRECTORY = '../secret'

    expect(() => getInputs()).toThrow('Invalid input: working_directory')
  })
})
