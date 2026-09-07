// Helpers for the end-to-end tests that run the bundled `dist/index.js` as a
// child process against a local mock of the GitHub REST API.
import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as http from 'node:http'
import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const rootDir = path.resolve(here, '..', '..')
export const bundlePath = path.join(rootDir, 'dist', 'index.js')
export const eventDir = path.join(rootDir, '__tests__', 'testdata', 'event')
export const auditDir = path.join(rootDir, '__tests__', 'testdata', 'audit')

export type RecordedRequest = {
  method: string
  path: string
  // biome-ignore lint/suspicious/noExplicitAny: request bodies are arbitrary JSON
  body: any
  authorization?: string
}

export type MockApiResponses = {
  // returned by GET /repos/{owner}/{repo}/issues
  issues?: Array<{ number: number; title: string; body?: string | null }>
  // returned by GET /repos/{owner}/{repo}/issues/{n}/comments
  comments?: Array<{ id: number; body?: string | null }>
}

export type MockApi = {
  url: string
  requests: RecordedRequest[]
  close: () => Promise<void>
}

const ISSUES = /^\/repos\/([^/]+)\/([^/]+)\/issues$/
const ISSUE_COMMENTS = /^\/repos\/([^/]+)\/([^/]+)\/issues\/(\d+)\/comments$/
const COMMENT = /^\/repos\/([^/]+)\/([^/]+)\/issues\/comments\/(\d+)$/

export async function startMockApi(
  responses: MockApiResponses = {}
): Promise<MockApi> {
  const requests: RecordedRequest[] = []

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8')
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      requests.push({
        method: req.method ?? '',
        path: req.url ?? '',
        body: raw ? JSON.parse(raw) : null,
        authorization: req.headers.authorization
      })

      const send = (status: number, payload: unknown): void => {
        res.writeHead(status, { 'content-type': 'application/json' })
        res.end(JSON.stringify(payload))
      }

      const pathname = url.pathname
      if (req.method === 'POST' && ISSUES.test(pathname)) {
        send(201, { number: 1, html_url: 'https://example.test/issues/1' })
        return
      }
      if (req.method === 'GET' && ISSUES.test(pathname)) {
        send(200, responses.issues ?? [])
        return
      }
      if (req.method === 'POST' && ISSUE_COMMENTS.test(pathname)) {
        send(201, { id: 10, url: 'https://example.test/comments/10' })
        return
      }
      if (req.method === 'GET' && ISSUE_COMMENTS.test(pathname)) {
        send(200, responses.comments ?? [])
        return
      }
      const commentMatch = COMMENT.exec(pathname)
      if (req.method === 'PATCH' && commentMatch) {
        send(200, { id: Number(commentMatch[3]) })
        return
      }
      send(404, { message: `unexpected ${req.method} ${pathname}` })
    })
  })

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('failed to start the mock API server')
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      })
  }
}

// `npm audit` must not hit the network and must produce a deterministic
// report, so the action is run with a stub `npm` at the front of PATH.
export function createNpmStub(fixture: string, status: number): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-audit-action-e2e-'))
  const script = `#!/bin/sh\ncat ${JSON.stringify(path.join(auditDir, fixture))}\nexit ${status}\n`
  const file = path.join(dir, 'npm')
  fs.writeFileSync(file, script, { mode: 0o755 })
  return dir
}

export type RunOptions = {
  inputs?: Record<string, string>
  eventName?: string
  eventFile?: string
  apiUrl: string
  auditFixture?: string
  auditStatus?: number
}

// Mirrors the defaults declared in action.yml; the runner passes every input
// with a default as an INPUT_* variable, and core.getBooleanInput throws when
// one is missing.
const defaultInputs: Record<string, string> = {
  audit_level: 'low',
  create_issues: 'true',
  create_pr_comments: 'true',
  fail_on_vulnerabilities: 'true',
  dedupe_comments: 'false',
  dedupe_issues: 'false',
  issue_title: 'npm audit found vulnerabilities',
  json_flag: 'false',
  production_flag: 'false',
  report_format: 'text',
  resolve_pr_comments: 'false',
  github_token: 'test-token'
}

export type RunResult = {
  status: number | null
  stdout: string
  stderr: string
}

// The mock API runs in this process, so the child must be spawned
// asynchronously: spawnSync would block the event loop and the server would
// never answer the request.
export async function runAction(options: RunOptions): Promise<RunResult> {
  const inputs = { ...defaultInputs, ...options.inputs }
  const env: Record<string, string> = {
    PATH: `${createNpmStub(options.auditFixture ?? 'error.txt', options.auditStatus ?? 1)}${path.delimiter}${process.env.PATH ?? ''}`,
    HOME: process.env.HOME ?? os.homedir(),
    GITHUB_API_URL: options.apiUrl,
    GITHUB_REPOSITORY: 'oke-py/npm-audit-action',
    GITHUB_EVENT_NAME: options.eventName ?? 'push',
    GITHUB_EVENT_PATH: path.join(
      eventDir,
      options.eventFile ?? 'pull_request.json'
    )
  }
  for (const [key, value] of Object.entries(inputs)) {
    env[`INPUT_${key.toUpperCase()}`] = value
  }

  return new Promise<RunResult>((resolve, reject) => {
    const child = spawn(process.execPath, [bundlePath], {
      cwd: rootDir,
      env
    })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk
    })
    child.on('error', reject)
    child.on('close', (status) => {
      resolve({ status, stdout, stderr })
    })
  })
}
