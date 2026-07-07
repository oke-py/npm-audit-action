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
    process.env.INPUT_CREATE_ISSUES = 'true'
    process.env.INPUT_DEDUPE_ISSUES = 'false'
    process.env.INPUT_ISSUE_TITLE = 'npm audit found vulnerabilities'
    process.env.INPUT_GITHUB_TOKEN = 'token'
  })

  test('returns normalized inputs', () => {
    process.env.INPUT_AUDIT_LEVEL = ' low '
    process.env.INPUT_ISSUE_TITLE = '  title '

    const inputs = getInputs()

    expect(inputs.auditLevel).toBe('low')
    expect(inputs.issueTitle).toBe('title')
  })

  test('throws on invalid audit_level', () => {
    process.env.INPUT_AUDIT_LEVEL = 'invalid'
    expect(() => getInputs()).toThrow('Invalid input: audit_level')
  })

  test('throws when github_token is missing', () => {
    process.env.INPUT_GITHUB_TOKEN = ''
    expect(() => getInputs()).toThrow('Input required and not supplied')
  })
})
