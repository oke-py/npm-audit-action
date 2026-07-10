import * as fs from 'node:fs'
import * as path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAX_BODY_LENGTH } from '../src/audit'
import { buildMarkdownReport } from '../src/report'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const v2Report = fs
  .readFileSync(path.join(__dirname, 'testdata/audit/error-v2.json'))
  .toString()

// Builds an auditReportVersion 2 JSON report with `count` vulnerabilities
function reportWithVulnerabilities(count: number): string {
  const vulnerabilities: Record<string, unknown> = {}
  for (let i = 0; i < count; i++) {
    const name = `package-${String(i).padStart(4, '0')}`
    vulnerabilities[name] = {
      name,
      severity: 'high',
      via: [
        {
          title: `Vulnerability in ${name}`,
          url: `https://github.com/advisories/GHSA-${i}`
        }
      ],
      range: '<1.0.0',
      fixAvailable: true
    }
  }
  return JSON.stringify({ auditReportVersion: 2, vulnerabilities })
}

describe('buildMarkdownReport', () => {
  test('renders a summary and a table from the JSON report', () => {
    const body = buildMarkdownReport(v2Report)

    expect(body).not.toBeNull()
    expect(body).toContain('## npm audit report')
    expect(body).toContain(
      '**3 vulnerabilities** (critical: 2, high: 1, moderate: 0, low: 0, info: 0)'
    )
    expect(body).toContain(
      '| Package | Severity | Vulnerable versions | Advisory | Fix available |'
    )
    expect(body).toContain(
      '| lodash | high | \\<4.17.21 | [Command Injection in lodash](https://github.com/advisories/GHSA-35jh-r3h4-6jhm) | lodash@4.17.21 |'
    )
    expect(body).toContain(
      '| minimist | critical | \\<0.2.4 | [Prototype Pollution in minimist](https://github.com/advisories/GHSA-xvch-5gv4-984h) | yes |'
    )
    expect(body).toContain(
      '| mkdirp | critical | 0.4.1 - 0.5.1 | via minimist | no |'
    )
  })

  test('sorts rows by severity and then by package name', () => {
    const body = buildMarkdownReport(v2Report) as string

    const minimist = body.indexOf('| minimist |')
    const mkdirp = body.indexOf('| mkdirp |')
    const lodash = body.indexOf('| lodash |')
    expect(minimist).toBeGreaterThan(-1)
    // critical before high, minimist before mkdirp
    expect(minimist).toBeLessThan(mkdirp)
    expect(mkdirp).toBeLessThan(lodash)
  })

  test('escapes markdown syntax and newlines in cells', () => {
    const report = JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: {
        evil: {
          name: 'evil',
          severity: 'low',
          via: [{ title: 'a | b\nc [link](x) `code` <img>' }],
          range: '<1.0.0 || >2.0.0',
          fixAvailable: false
        }
      }
    })

    const body = buildMarkdownReport(report) as string

    expect(body).toContain(
      '| evil | low | \\<1.0.0 \\|\\| \\>2.0.0 | a \\| b c \\[link\\](x) \\`code\\` \\<img\\> | no |'
    )
  })

  test('renders only http(s) urls without breakout characters as links', () => {
    const report = JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: {
        odd: {
          name: 'odd',
          severity: 'low',
          via: [
            { title: 'Scheme', url: 'javascript:alert(1)' },
            { title: 'Paren', url: 'https://example.com/a)b' },
            { title: 'Space', url: 'https://example.com/a b' },
            { title: 'Empty', url: '' },
            { title: 'Fine', url: 'https://example.com/ok' }
          ],
          range: '*',
          fixAvailable: false
        }
      }
    })

    const body = buildMarkdownReport(report) as string

    expect(body).toContain(
      '| odd | low | * | Scheme<br>Paren<br>Space<br>Empty<br>[Fine](https://example.com/ok) | no |'
    )
  })

  test('marks a semver-major fix', () => {
    const report = JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: {
        left: {
          name: 'left',
          severity: 'moderate',
          via: [{ title: 't', url: 'https://example.com' }],
          range: '*',
          fixAvailable: { name: 'left', version: '2.0.0', isSemVerMajor: true }
        }
      }
    })

    const body = buildMarkdownReport(report) as string

    expect(body).toContain('| left@2.0.0 (major) |')
    expect(body).toContain(
      '**1 vulnerability** (critical: 0, high: 0, moderate: 1, low: 0, info: 0)'
    )
  })

  test('returns the full table when it fits within the limit', () => {
    const body = buildMarkdownReport(reportWithVulnerabilities(10)) as string

    expect(body.length).toBeLessThanOrEqual(MAX_BODY_LENGTH)
    expect(body).not.toContain('omitted')
    expect(body).toContain('| package-0009 |')
  })

  test('drops whole rows when the report exceeds the limit', () => {
    const total = 1000
    const body = buildMarkdownReport(reportWithVulnerabilities(total)) as string

    expect(body.length).toBeLessThanOrEqual(MAX_BODY_LENGTH)
    // every remaining line is intact: a complete table row, header, or notice
    const lines = body.trimEnd().split('\n')
    const rows = lines.filter((line) => line.startsWith('| package-'))
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThan(total)
    for (const row of rows) {
      expect(row).toMatch(
        /^\| package-\d{4} \| high \| \\<1\.0\.0 \| \[.+\) \| yes \|$/
      )
    }
    expect(body).toContain(
      `**Note:** ${total - rows.length} of ${total} vulnerabilities omitted because the report exceeds the maximum body length GitHub accepts.`
    )
  })

  test('reserves room for content appended by the caller', () => {
    const reserved = 500
    const body = buildMarkdownReport(
      reportWithVulnerabilities(1000),
      reserved
    ) as string

    expect(body.length).toBeLessThanOrEqual(MAX_BODY_LENGTH - reserved)
    expect(body).toContain('omitted')
  })

  test('renders empty cells and no fix for missing fields', () => {
    const report = JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: {
        broken: { severity: 'unknown' },
        unrated: { name: 'unrated', fixAvailable: null }
      }
    })

    const body = buildMarkdownReport(report) as string

    expect(body).toContain('|  | unknown |  |  | no |')
    expect(body).toContain('| unrated |  |  |  | no |')
  })

  test('skips via entries that are not advisories or package names', () => {
    const report = JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: {
        odd: {
          name: 'odd',
          severity: 'low',
          via: [
            123,
            null,
            {},
            { title: 'No link advisory' },
            { url: 'https://example.com/untitled' }
          ],
          range: '*',
          fixAvailable: true
        }
      }
    })

    const body = buildMarkdownReport(report) as string

    expect(body).toContain(
      '| odd | low | * | No link advisory<br>[](https://example.com/untitled) | yes |'
    )
  })

  test('fills in missing metadata counts and total', () => {
    const report = JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: {
        one: { name: 'one', severity: 'high', range: '*', fixAvailable: true }
      },
      metadata: { vulnerabilities: { high: 1 } }
    })

    const body = buildMarkdownReport(report) as string

    expect(body).toContain(
      '**1 vulnerability** (critical: 0, high: 1, moderate: 0, low: 0, info: 0)'
    )
  })

  test('returns null when nothing fits within the reserved length', () => {
    expect(
      buildMarkdownReport(reportWithVulnerabilities(5), MAX_BODY_LENGTH)
    ).toBeNull()
  })

  test('returns null for non-JSON output', () => {
    expect(buildMarkdownReport('found 3 vulnerabilities')).toBeNull()
  })

  test('returns null for a v1 JSON report', () => {
    const v1Report = fs
      .readFileSync(path.join(__dirname, 'testdata/audit/error.json'))
      .toString()

    expect(buildMarkdownReport(v1Report)).toBeNull()
  })

  test('returns null for JSON without vulnerabilities', () => {
    expect(buildMarkdownReport('{"auditReportVersion":2}')).toBeNull()
    expect(buildMarkdownReport('null')).toBeNull()
  })

  test('computes the summary from vulnerabilities when metadata is missing', () => {
    const body = buildMarkdownReport(reportWithVulnerabilities(3)) as string

    expect(body).toContain(
      '**3 vulnerabilities** (critical: 0, high: 3, moderate: 0, low: 0, info: 0)'
    )
  })
})
