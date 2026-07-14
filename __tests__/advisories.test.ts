import * as fs from 'node:fs'
import * as path from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildIgnoredNotice,
  evaluateIgnoredAdvisories
} from '../src/advisories'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// lodash: high via GHSA-35jh-r3h4-6jhm
// minimist: critical via GHSA-xvch-5gv4-984h
// mkdirp: critical, transitive via minimist only
const auditJson = fs
  .readFileSync(path.join(__dirname, 'testdata/audit/error-v2.json'))
  .toString()

const LODASH_GHSA = 'GHSA-35jh-r3h4-6jhm'
const MINIMIST_GHSA = 'GHSA-xvch-5gv4-984h'

describe('evaluateIgnoredAdvisories', () => {
  test('remains vulnerable when nothing is ignored', () => {
    const result = evaluateIgnoredAdvisories(auditJson, [], 'low')
    expect(result).toEqual({ vulnerable: true, ignored: [] })
  })

  test('is not vulnerable when every advisory is ignored', () => {
    const result = evaluateIgnoredAdvisories(
      auditJson,
      [LODASH_GHSA, MINIMIST_GHSA],
      'low'
    )
    expect(result?.vulnerable).toBe(false)
    expect(result?.ignored.map((a) => a.ghsaId).sort()).toEqual([
      LODASH_GHSA,
      MINIMIST_GHSA
    ])
  })

  test('ignoring an advisory covers transitively affected packages', () => {
    // mkdirp is vulnerable only through minimist, so ignoring the minimist
    // advisory must not leave mkdirp counted as a remaining vulnerability
    const result = evaluateIgnoredAdvisories(auditJson, [MINIMIST_GHSA], 'low')
    expect(result?.vulnerable).toBe(true) // lodash remains
    expect(result?.ignored.map((a) => a.ghsaId)).toEqual([MINIMIST_GHSA])
  })

  test('matches GHSA IDs case-insensitively', () => {
    const result = evaluateIgnoredAdvisories(
      auditJson,
      [LODASH_GHSA.toLowerCase(), MINIMIST_GHSA.toUpperCase()],
      'low'
    )
    expect(result?.vulnerable).toBe(false)
  })

  test('applies the audit level to the remaining advisories', () => {
    // with minimist (critical) ignored, only lodash (high) remains,
    // which is below the critical level
    const result = evaluateIgnoredAdvisories(
      auditJson,
      [MINIMIST_GHSA],
      'critical'
    )
    expect(result?.vulnerable).toBe(false)
  })

  test('never vulnerable at audit level none', () => {
    const result = evaluateIgnoredAdvisories(auditJson, [], 'none')
    expect(result?.vulnerable).toBe(false)
  })

  test('an ignored GHSA absent from the report changes nothing', () => {
    const result = evaluateIgnoredAdvisories(
      auditJson,
      ['GHSA-aaaa-bbbb-cccc'],
      'low'
    )
    expect(result).toEqual({ vulnerable: true, ignored: [] })
  })

  test('returns null for a v1 report', () => {
    const v1 = fs
      .readFileSync(path.join(__dirname, 'testdata/audit/error.json'))
      .toString()
    expect(evaluateIgnoredAdvisories(v1, [LODASH_GHSA], 'low')).toBeNull()
  })

  test('returns null for non-JSON output', () => {
    expect(evaluateIgnoredAdvisories('not json', [], 'low')).toBeNull()
  })

  test('returns null when no advisory carries a GHSA ID', () => {
    const report = JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: {
        foo: { via: ['bar'] }
      }
    })
    expect(evaluateIgnoredAdvisories(report, [], 'low')).toBeNull()
  })

  test('treats an unknown severity as vulnerable', () => {
    const report = JSON.stringify({
      auditReportVersion: 2,
      vulnerabilities: {
        foo: {
          via: [
            {
              url: 'https://github.com/advisories/GHSA-aaaa-bbbb-cccc',
              severity: 'unheard-of'
            }
          ]
        }
      }
    })
    const result = evaluateIgnoredAdvisories(report, [], 'critical')
    expect(result?.vulnerable).toBe(true)
  })
})

describe('buildIgnoredNotice', () => {
  test('lists the ignored advisories with their packages', () => {
    const notice = buildIgnoredNotice([
      { ghsaId: LODASH_GHSA, severity: 'high', packages: ['lodash'] },
      {
        ghsaId: MINIMIST_GHSA,
        severity: 'critical',
        packages: ['minimist', 'mkdirp']
      }
    ])
    expect(notice).toContain('`ignore_ghsas`')
    expect(notice).toContain(`${LODASH_GHSA} (lodash)`)
    expect(notice).toContain(`${MINIMIST_GHSA} (minimist, mkdirp)`)
  })
})
