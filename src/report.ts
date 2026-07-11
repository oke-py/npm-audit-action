import { stripVTControlCharacters } from 'node:util'
import { MAX_BODY_LENGTH } from './audit.js'

// npm v7+ (`auditReportVersion: 2`) JSON report shapes, limited to the
// fields the markdown report renders
type Advisory = {
  title?: string
  url?: string
}

type FixAvailable =
  | boolean
  | { name?: string; version?: string; isSemVerMajor?: boolean }

type Vulnerability = {
  name?: string
  severity?: string
  range?: string
  via?: Array<Advisory | string>
  fixAvailable?: FixAvailable
}

type AuditReport = {
  auditReportVersion?: unknown
  vulnerabilities?: Record<string, Vulnerability>
  metadata?: {
    vulnerabilities?: Record<string, number>
  }
}

const SEVERITIES = ['critical', 'high', 'moderate', 'low', 'info']

const TABLE_HEADER = `| Package | Severity | Vulnerable versions | Advisory | Fix available |
|---|---|---|---|---|
`

// Strip terminal escape sequences and backslash-escape markdown syntax so
// cell content renders literally, replacing line breaks (including a lone
// \r, which GFM also treats as one), which would end the table row
function escapeCell(value: string): string {
  return stripVTControlCharacters(value)
    .replace(/[\r\n]+/g, ' ')
    .replace(/[[\]`<>|*]/g, '\\$&')
}

// Only http(s) URLs free of characters that would break out of the markdown
// link destination or split the table cell are rendered as links
function isRenderableUrl(value: string): boolean {
  if (/[\s()<>|]/.test(value)) {
    return false
  }
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return false
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
}

function advisoryCell(via: Vulnerability['via']): string {
  if (!Array.isArray(via)) {
    return ''
  }
  const parts: string[] = []
  for (const entry of via) {
    if (typeof entry === 'string') {
      parts.push(`via ${escapeCell(entry)}`)
      continue
    }
    if (entry === null || typeof entry !== 'object') {
      continue
    }
    const title = escapeCell(entry.title ?? '')
    if (typeof entry.url === 'string' && isRenderableUrl(entry.url)) {
      parts.push(`[${title}](${entry.url})`)
    } else if (title !== '') {
      parts.push(title)
    }
  }
  return parts.join('<br>')
}

function fixAvailableCell(fixAvailable: FixAvailable | undefined): string {
  if (fixAvailable === true) {
    return 'yes'
  }
  if (fixAvailable !== null && typeof fixAvailable === 'object') {
    const major = fixAvailable.isSemVerMajor ? ' (major)' : ''
    return escapeCell(`${fixAvailable.name}@${fixAvailable.version}${major}`)
  }
  return 'no'
}

function severityRank(severity: string | undefined): number {
  const rank = SEVERITIES.indexOf(severity ?? '')
  return rank === -1 ? SEVERITIES.length : rank
}

function buildSummary(
  metadata: AuditReport['metadata'],
  vulnerabilities: Vulnerability[]
): string {
  const counts: Record<string, number> = {}
  for (const severity of SEVERITIES) {
    counts[severity] = 0
  }
  let other = 0
  let total = vulnerabilities.length
  if (metadata?.vulnerabilities) {
    for (const severity of SEVERITIES) {
      counts[severity] = metadata.vulnerabilities[severity] ?? 0
    }
    total = metadata.vulnerabilities.total ?? total
  } else {
    for (const vulnerability of vulnerabilities) {
      const severity = vulnerability.severity ?? ''
      if (severity in counts) {
        counts[severity]++
      } else {
        other++
      }
    }
  }

  const breakdown = SEVERITIES.map(
    (severity) => `${severity}: ${counts[severity]}`
  )
  if (other > 0) {
    breakdown.push(`other: ${other}`)
  }
  const noun = total === 1 ? 'vulnerability' : 'vulnerabilities'
  return `**${total} ${noun}** (${breakdown.join(', ')})`
}

function buildRow(vulnerability: Vulnerability): string {
  const cells = [
    escapeCell(vulnerability.name ?? ''),
    escapeCell(vulnerability.severity ?? ''),
    escapeCell(vulnerability.range ?? ''),
    advisoryCell(vulnerability.via),
    fixAvailableCell(vulnerability.fixAvailable)
  ]
  return `| ${cells.join(' | ')} |\n`
}

function omissionNotice(omitted: number, total: number): string {
  return `\n**Note:** ${omitted} of ${total} vulnerabilities omitted because the report exceeds the maximum body length GitHub accepts.`
}

// Builds a markdown report from `npm audit --json` output (npm v7+,
// auditReportVersion 2). Returns null when the output cannot be rendered so
// the caller can fall back to the plain-text report.
//
// The report is kept within the GitHub body length limit by dropping whole
// table rows, never by slicing a row in the middle, so the table stays valid.
// reservedLength leaves room for content the caller appends to the body.
export function buildMarkdownReport(
  stdout: string,
  reservedLength = 0
): string | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(stdout)
  } catch {
    return null
  }
  if (parsed === null || typeof parsed !== 'object') {
    return null
  }
  const report = parsed as AuditReport
  if (report.auditReportVersion !== 2) {
    return null
  }
  if (
    report.vulnerabilities === null ||
    typeof report.vulnerabilities !== 'object'
  ) {
    return null
  }

  const vulnerabilities = Object.values(report.vulnerabilities).sort(
    (a, b) =>
      severityRank(a.severity) - severityRank(b.severity) ||
      (a.name ?? '').localeCompare(b.name ?? '')
  )

  const summary = buildSummary(report.metadata, vulnerabilities)
  const header = `## npm audit report\n\n${summary}\n\n${TABLE_HEADER}`
  const rows = vulnerabilities.map(buildRow)

  const maxLength = MAX_BODY_LENGTH - reservedLength
  let length = header.length + rows.reduce((sum, row) => sum + row.length, 0)
  if (length <= maxLength) {
    return header + rows.join('')
  }

  // Drop rows from the end until the body, including the omission notice,
  // fits. The notice is recomputed each step because its length depends on
  // the omitted count.
  for (let included = rows.length - 1; included >= 0; included--) {
    length -= rows[included].length
    const notice = omissionNotice(rows.length - included, rows.length)
    if (length + notice.length <= maxLength) {
      return header + rows.slice(0, included).join('') + notice
    }
  }
  return null
}
