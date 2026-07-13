// npm v7+ (`auditReportVersion: 2`) JSON report shape, limited to the
// fields the ignore evaluation reads
type Via = {
  url?: unknown
  severity?: unknown
}

type AuditReport = {
  auditReportVersion?: unknown
  vulnerabilities?: Record<string, { via?: Array<Via | string> }>
}

export type FoundAdvisory = {
  ghsaId: string
  severity: string
  packages: string[]
}

export type IgnoreEvaluation = {
  vulnerable: boolean
  ignored: FoundAdvisory[]
}

const GHSA_ID_PATTERN = /GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/i

// npm severities, weakest first
const SEVERITY_ORDER = ['info', 'low', 'moderate', 'high', 'critical']

// An advisory with a severity npm does not document is treated as meeting
// the level, so a report format change fails loud instead of going green
function meetsLevel(severity: string, auditLevel: string): boolean {
  if (auditLevel === 'none') {
    return false
  }
  const rank = SEVERITY_ORDER.indexOf(severity)
  const threshold = SEVERITY_ORDER.indexOf(auditLevel)
  if (rank === -1 || threshold === -1) {
    return true
  }
  return rank >= threshold
}

// Extracts the advisories from `npm audit --json` output and decides whether
// any non-ignored advisory at or above auditLevel remains. Transitive
// vulnerabilities reference their root advisory, so ignoring the root GHSA
// covers the whole chain. Returns null when the output cannot be interpreted
// so the caller can keep npm's own exit-status-based decision.
export function evaluateIgnoredAdvisories(
  stdout: string,
  ignoreGhsas: string[],
  auditLevel: string
): IgnoreEvaluation | null {
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

  const advisories = new Map<string, FoundAdvisory>()
  for (const [pkg, vulnerability] of Object.entries(report.vulnerabilities)) {
    const via = Array.isArray(vulnerability?.via) ? vulnerability.via : []
    for (const entry of via) {
      if (entry === null || typeof entry !== 'object') {
        continue
      }
      const url = typeof entry.url === 'string' ? entry.url : ''
      const match = url.match(GHSA_ID_PATTERN)
      if (!match) {
        continue
      }
      const key = match[0].toLowerCase()
      const severity = typeof entry.severity === 'string' ? entry.severity : ''
      const existing = advisories.get(key)
      if (existing) {
        if (!existing.packages.includes(pkg)) {
          existing.packages.push(pkg)
        }
      } else {
        advisories.set(key, { ghsaId: match[0], severity, packages: [pkg] })
      }
    }
  }

  // npm reported vulnerabilities but none carries a GHSA advisory; the
  // report cannot be evaluated against the ignore list
  if (advisories.size === 0) {
    return null
  }

  const ignoreSet = new Set(ignoreGhsas.map((ghsa) => ghsa.toLowerCase()))
  let vulnerable = false
  const ignored: FoundAdvisory[] = []
  for (const [key, advisory] of advisories) {
    if (ignoreSet.has(key)) {
      ignored.push(advisory)
    } else if (meetsLevel(advisory.severity, auditLevel)) {
      vulnerable = true
    }
  }
  return { vulnerable, ignored }
}

// Appended to the report body so suppressions stay visible to reviewers
export function buildIgnoredNotice(ignored: FoundAdvisory[]): string {
  const items = ignored.map(
    (advisory) => `${advisory.ghsaId} (${advisory.packages.join(', ')})`
  )
  return `\n\n**Note:** the following advisories were ignored via \`ignore_ghsas\` and did not affect the result: ${items.join(', ')}`
}
