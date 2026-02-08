import * as core from '@actions/core'

const auditLevels = new Set([
  'critical',
  'high',
  'moderate',
  'low',
  'info',
  'none'
])

export type Inputs = {
  auditLevel: string
  productionFlag: boolean
  jsonFlag: boolean
  failOnVulnerabilities: boolean
  createPRComments: boolean
  createIssues: boolean
  dedupeIssues: boolean
  issueTitle: string
  githubContext: any
  token: string
}

export function getInputs(): Inputs {
  const auditLevel = core.getInput('audit_level', { trimWhitespace: true })
  if (!auditLevels.has(auditLevel)) {
    throw new Error('Invalid input: audit_level')
  }

  const githubContext = JSON.parse(
    core.getInput('github_context', { trimWhitespace: true })
  ) as Inputs['githubContext']

  return {
    auditLevel,
    productionFlag: core.getBooleanInput('production_flag'),
    jsonFlag: core.getBooleanInput('json_flag'),
    failOnVulnerabilities: core.getBooleanInput('fail_on_vulnerabilities'),
    createPRComments: core.getBooleanInput('create_pr_comments'),
    createIssues: core.getBooleanInput('create_issues'),
    dedupeIssues: core.getBooleanInput('dedupe_issues'),
    issueTitle: core.getInput('issue_title', { trimWhitespace: true }),
    githubContext,
    token: core.getInput('github_token', {
      required: true,
      trimWhitespace: true
    })
  }
}
