import * as core from '@actions/core'
import { getNormalizedWorkingDirectory } from './workdir.js'

const auditLevels = new Set([
  'critical',
  'high',
  'moderate',
  'low',
  'info',
  'none'
])

// The registry value is passed to a shell on Windows, so on top of being a
// valid http(s) URL it must not contain cmd.exe metacharacters
const registryPattern = /^[A-Za-z0-9._~:/@+-]+$/

function isValidRegistryUrl(value: string): boolean {
  if (!registryPattern.test(value)) {
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

function parseList(value: string): string[] | undefined {
  const parsed = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return parsed.length > 0 ? parsed : undefined
}

const reportFormats = new Set(['text', 'markdown'])

export type ReportFormat = 'text' | 'markdown'

export type Inputs = {
  auditLevel: string
  registry: string
  productionFlag: boolean
  jsonFlag: boolean
  reportFormat: ReportFormat
  failOnVulnerabilities: boolean
  createPRComments: boolean
  resolvePRComments: boolean
  createIssues: boolean
  dedupeIssues: boolean
  dedupeComments: boolean
  issueTitle: string
  issueAssignees?: string[]
  issueLabels?: string[]
  issueType?: string
  workingDirectory: string | null
  token: string
}

export function getInputs(): Inputs {
  const auditLevel = core.getInput('audit_level', { trimWhitespace: true })
  if (!auditLevels.has(auditLevel)) {
    throw new Error('Invalid input: audit_level')
  }

  const registry = core.getInput('registry', { trimWhitespace: true })
  if (registry && !isValidRegistryUrl(registry)) {
    throw new Error('Invalid input: registry must be a valid http(s) URL')
  }

  const reportFormat =
    core.getInput('report_format', { trimWhitespace: true }) || 'text'
  if (!reportFormats.has(reportFormat)) {
    throw new Error('Invalid input: report_format')
  }

  return {
    auditLevel,
    registry,
    productionFlag: core.getBooleanInput('production_flag'),
    jsonFlag: core.getBooleanInput('json_flag'),
    reportFormat: reportFormat as ReportFormat,
    failOnVulnerabilities: core.getBooleanInput('fail_on_vulnerabilities'),
    createPRComments: core.getBooleanInput('create_pr_comments'),
    resolvePRComments: core.getBooleanInput('resolve_pr_comments'),
    createIssues: core.getBooleanInput('create_issues'),
    dedupeIssues: core.getBooleanInput('dedupe_issues'),
    dedupeComments: core.getBooleanInput('dedupe_comments'),
    issueTitle: core.getInput('issue_title', { trimWhitespace: true }),
    issueAssignees: parseList(
      core.getInput('issue_assignees', { trimWhitespace: true })
    ),
    issueLabels: parseList(
      core.getInput('issue_labels', { trimWhitespace: true })
    ),
    issueType:
      core.getInput('issue_type', { trimWhitespace: true }) || undefined,
    workingDirectory: getNormalizedWorkingDirectory(
      core.getInput('working_directory', { trimWhitespace: true })
    ),
    token: core.getInput('github_token', {
      required: true,
      trimWhitespace: true
    })
  }
}
