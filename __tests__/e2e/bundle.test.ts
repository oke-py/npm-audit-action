// End-to-end tests for the built bundle.
//
// These run `node dist/index.js` as a child process against a local mock of
// the GitHub REST API, so they cover the `@octokit/rest` code paths as they
// exist *after* bundling. Unit tests mock `@octokit/rest` at the module level
// and by construction cannot catch bundling regressions.
import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  auditDir,
  bundlePath,
  type MockApi,
  type MockApiResponses,
  runAction,
  startMockApi
} from './helpers'

const REPORT_MARKER = '<!-- npm-audit-action -->'
const RESOLVED_MARKER = '<!-- npm-audit-action:resolved -->'
const ISSUE_TITLE = 'npm audit found vulnerabilities'
const COMMENTS_PATH = '/repos/oke-py/npm-audit-action/issues/100/comments'
const ISSUES_PATH = '/repos/oke-py/npm-audit-action/issues'

const auditText = fs.readFileSync(path.join(auditDir, 'error.txt'), 'utf8')
const reportBody = `\`\`\`\n${auditText}\n\`\`\``

let api: MockApi | null = null

async function withMockApi(responses?: MockApiResponses): Promise<MockApi> {
  api = await startMockApi(responses)
  return api
}

afterEach(async () => {
  await api?.close()
  api = null
})

// The stub `npm` is a POSIX shell script; the bundle itself is covered on
// Windows by the `test-on-windows` job in test.yml.
describe.skipIf(process.platform === 'win32')('dist/index.js', () => {
  it('is built', () => {
    expect(fs.existsSync(bundlePath)).toBe(true)
  })

  it('posts a pull request comment when vulnerabilities are found', async () => {
    const mock = await withMockApi()

    const result = await runAction({
      apiUrl: mock.url,
      eventName: 'pull_request',
      eventFile: 'pull_request.json'
    })

    // fail_on_vulnerabilities defaults to true
    expect(result.status).toBe(1)
    expect(mock.requests).toHaveLength(1)
    const [request] = mock.requests
    expect(request.method).toBe('POST')
    expect(request.path).toBe(COMMENTS_PATH)
    expect(request.body.body).toBe(reportBody)
    expect(request.authorization).toBe('token test-token')
  })

  it('calls no API when create_pr_comments is false', async () => {
    const mock = await withMockApi()

    const result = await runAction({
      apiUrl: mock.url,
      eventName: 'pull_request',
      inputs: {
        create_pr_comments: 'false',
        fail_on_vulnerabilities: 'false'
      }
    })

    expect(result.status).toBe(0)
    expect(mock.requests).toHaveLength(0)
  })

  it('creates an issue on a push event when vulnerabilities are found', async () => {
    const mock = await withMockApi()

    const result = await runAction({
      apiUrl: mock.url,
      eventName: 'push',
      inputs: {
        issue_labels: 'security, audit',
        issue_assignees: 'oke-py'
      }
    })

    expect(result.status).toBe(1)
    expect(mock.requests).toHaveLength(1)
    const [request] = mock.requests
    expect(request.method).toBe('POST')
    expect(request.path).toBe(ISSUES_PATH)
    expect(request.body).toMatchObject({
      title: ISSUE_TITLE,
      body: reportBody,
      labels: ['security', 'audit'],
      assignees: ['oke-py']
    })
  })

  it('exits successfully when fail_on_vulnerabilities is false', async () => {
    const mock = await withMockApi()

    const result = await runAction({
      apiUrl: mock.url,
      eventName: 'push',
      inputs: { fail_on_vulnerabilities: 'false' }
    })

    expect(result.status).toBe(0)
    expect(mock.requests.map((r) => r.method)).toEqual(['POST'])
  })

  it('skips commenting on the existing issue when the report is unchanged', async () => {
    const mock = await withMockApi({
      issues: [{ number: 42, title: ISSUE_TITLE, body: null }],
      comments: [{ id: 7, body: `${reportBody}\n\n${REPORT_MARKER}` }]
    })

    const result = await runAction({
      apiUrl: mock.url,
      eventName: 'push',
      inputs: {
        dedupe_issues: 'true',
        dedupe_comments: 'true',
        fail_on_vulnerabilities: 'false'
      }
    })

    expect(result.status).toBe(0)
    expect(mock.requests.map((r) => r.method)).toEqual(['GET', 'GET'])
    expect(mock.requests[0].path).toContain(`${ISSUES_PATH}?`)
    expect(mock.requests[1].path).toContain(
      '/repos/oke-py/npm-audit-action/issues/42/comments'
    )
    expect(result.stdout).toContain('The report is unchanged')
  })

  it('comments on the existing issue when the report changed', async () => {
    const mock = await withMockApi({
      issues: [{ number: 42, title: ISSUE_TITLE, body: null }],
      comments: [{ id: 7, body: `stale report\n\n${REPORT_MARKER}` }]
    })

    const result = await runAction({
      apiUrl: mock.url,
      eventName: 'push',
      inputs: {
        dedupe_issues: 'true',
        dedupe_comments: 'true',
        fail_on_vulnerabilities: 'false'
      }
    })

    expect(result.status).toBe(0)
    const posted = mock.requests.filter((r) => r.method === 'POST')
    expect(posted).toHaveLength(1)
    expect(posted[0].path).toBe(
      '/repos/oke-py/npm-audit-action/issues/42/comments'
    )
    expect(posted[0].body.body).toBe(`${reportBody}\n\n${REPORT_MARKER}`)
  })

  it('marks previous pull request comments as resolved when the vulnerabilities are gone', async () => {
    const mock = await withMockApi({
      comments: [{ id: 7, body: `old report\n\n${REPORT_MARKER}` }]
    })

    const result = await runAction({
      apiUrl: mock.url,
      eventName: 'pull_request',
      auditFixture: 'success.txt',
      auditStatus: 0,
      inputs: { resolve_pr_comments: 'true' }
    })

    expect(result.status).toBe(0)
    expect(mock.requests.map((r) => r.method)).toEqual(['GET', 'PATCH'])
    const patch = mock.requests[1]
    expect(patch.path).toBe('/repos/oke-py/npm-audit-action/issues/comments/7')
    expect(patch.body.body).toContain(RESOLVED_MARKER)
    expect(patch.body.body).toContain('0123456')
  })
})
