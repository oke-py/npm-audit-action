import * as core from '@actions/core'

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

export type Inputs = {
  auditLevel: string
  registry: string
  productionFlag: boolean
  jsonFlag: boolean
  failOnVulnerabilities: boolean
  createPRComments: boolean
  createIssues: boolean
  dedupeIssues: boolean
  issueTitle: string
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

  return {
    auditLevel,
    registry,
    productionFlag: core.getBooleanInput('production_flag'),
    jsonFlag: core.getBooleanInput('json_flag'),
    failOnVulnerabilities: core.getBooleanInput('fail_on_vulnerabilities'),
    createPRComments: core.getBooleanInput('create_pr_comments'),
    createIssues: core.getBooleanInput('create_issues'),
    dedupeIssues: core.getBooleanInput('dedupe_issues'),
    issueTitle: core.getInput('issue_title', { trimWhitespace: true }),
    token: core.getInput('github_token', {
      required: true,
      trimWhitespace: true
    })
  }
}
