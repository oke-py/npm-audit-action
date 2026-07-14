import * as fs from 'node:fs'
import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import {
  buildIgnoredNotice,
  evaluateIgnoredAdvisories,
  type IgnoreEvaluation
} from './advisories.js'
import { Audit } from './audit.js'
import { getInputs, type ReportFormat } from './inputs.js'
import { REPORT_MARKER_LENGTH } from './issue.js'
import { handleIssueFlow } from './issue-flow.js'
import { RESOLVED_COMMENT_RESERVED_LENGTH } from './pr.js'
import { handlePullRequest, resolvePullRequestComments } from './pr-flow.js'
import { buildMarkdownReport } from './report.js'

// biome-ignore lint/suspicious/noExplicitAny: the event payload is arbitrary JSON
function readEventPayload(): any {
  const eventPath = process.env.GITHUB_EVENT_PATH
  if (!eventPath) {
    throw new Error('GITHUB_EVENT_PATH is not set')
  }
  return JSON.parse(fs.readFileSync(eventPath, 'utf8'))
}

function getPullRequestNumber(): number {
  const payload = readEventPayload()
  const number = payload?.pull_request?.number ?? payload?.number
  if (typeof number !== 'number') {
    throw new Error('Failed to read the pull request number from the event')
  }
  return number
}

function getPullRequestHeadSha(): string {
  const payload = readEventPayload()
  const sha = payload?.pull_request?.head?.sha ?? process.env.GITHUB_SHA
  if (typeof sha !== 'string' || sha === '') {
    throw new Error('Failed to read the head SHA from the event')
  }
  return sha
}

function buildReportBody(
  audit: Audit,
  reportFormat: ReportFormat,
  reservedLength: number
): string {
  if (reportFormat === 'markdown') {
    const markdown = buildMarkdownReport(audit.stdout, reservedLength)
    if (markdown !== null) {
      return markdown
    }
    core.warning(
      'Failed to build the markdown report from the `npm audit --json` output; posting the raw audit output in a code block instead'
    )
  }
  return audit.strippedStdout(reservedLength)
}

// Applies ignore_ghsas to the audit result. The evaluation needs the JSON
// report, so a text-format run without json_flag triggers a second
// `npm audit --json` run. Returns null when the report cannot be
// interpreted; the caller then keeps npm's exit-status-based decision.
function applyIgnoreList(
  audit: Audit,
  inputs: ReturnType<typeof getInputs>,
  ranWithJson: boolean
): IgnoreEvaluation | null {
  let jsonOutput = audit.stdout
  if (!ranWithJson) {
    const jsonAudit = new Audit()
    jsonAudit.run(
      inputs.auditLevel,
      inputs.productionFlag,
      true,
      inputs.registry
    )
    jsonOutput = jsonAudit.stdout
  }
  const evaluation = evaluateIgnoredAdvisories(
    jsonOutput,
    inputs.ignoreGhsas,
    inputs.auditLevel
  )
  if (evaluation === null) {
    core.warning(
      'Failed to interpret the `npm audit --json` report; ignore_ghsas was not applied'
    )
  }
  return evaluation
}

export async function run(): Promise<void> {
  try {
    const inputs = getInputs()

    // move to working directory
    if (inputs.workingDirectory) {
      try {
        // Try to change directory
        process.chdir(inputs.workingDirectory)
        core.info(
          `Successfully changed directory to: ${inputs.workingDirectory}`
        )
      } catch (error) {
        // If changing directory fails, log the error but continue
        core.warning(
          `Failed to change directory to: ${inputs.workingDirectory}`
        )
        core.warning(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        )
        core.warning('Continuing with current directory')
      }
    }
    core.info(`Current working directory: ${process.cwd()}`)

    // run `npm audit`
    // the markdown report is built from the `npm audit --json` output, so
    // report_format=markdown forces the --json flag
    const ranWithJson = inputs.jsonFlag || inputs.reportFormat === 'markdown'
    const audit = new Audit()
    audit.run(
      inputs.auditLevel,
      inputs.productionFlag,
      ranWithJson,
      inputs.registry
    )
    core.info(audit.stdout)
    core.setOutput('npm_audit', audit.stdout)

    let foundVulnerability = audit.foundVulnerability()
    let ignoredNotice = ''
    if (foundVulnerability && inputs.ignoreGhsas.length > 0) {
      const evaluation = applyIgnoreList(audit, inputs, ranWithJson)
      if (evaluation !== null) {
        if (evaluation.ignored.length > 0) {
          core.info(
            `Ignored advisories: ${evaluation.ignored
              .map((advisory) => advisory.ghsaId)
              .join(', ')}`
          )
          ignoredNotice = buildIgnoredNotice(evaluation.ignored)
        }
        if (!evaluation.vulnerable) {
          core.info(
            'Every advisory found at or above the audit level is ignored via ignore_ghsas; treating the result as no vulnerabilities'
          )
          foundVulnerability = false
        }
      }
    }

    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      if (foundVulnerability) {
        const octokit = new Octokit({
          auth: inputs.token
        })
        await handlePullRequest(
          octokit,
          getPullRequestNumber(),
          buildReportBody(
            audit,
            inputs.reportFormat,
            (inputs.resolvePRComments ? RESOLVED_COMMENT_RESERVED_LENGTH : 0) +
              ignoredNotice.length
          ) + ignoredNotice,
          {
            createPRComments: inputs.createPRComments,
            resolvePRComments: inputs.resolvePRComments,
            failOnVulnerabilities: inputs.failOnVulnerabilities
          }
        )
      } else if (inputs.resolvePRComments) {
        const octokit = new Octokit({
          auth: inputs.token
        })
        await resolvePullRequestComments(
          octokit,
          getPullRequestNumber(),
          getPullRequestHeadSha()
        )
      }
      return
    }

    if (foundVulnerability) {
      // vulnerabilities are found

      // get GitHub information
      const octokit = new Octokit({
        auth: inputs.token
      })

      core.debug('open an issue')
      const auditOutput =
        buildReportBody(
          audit,
          inputs.reportFormat,
          (inputs.dedupeComments ? REPORT_MARKER_LENGTH : 0) +
            ignoredNotice.length
        ) + ignoredNotice
      await handleIssueFlow(octokit, auditOutput, {
        createIssues: inputs.createIssues,
        dedupeIssues: inputs.dedupeIssues,
        dedupeComments: inputs.dedupeComments,
        failOnVulnerabilities: inputs.failOnVulnerabilities,
        issueTitle: inputs.issueTitle,
        issueAssignees: inputs.issueAssignees,
        issueLabels: inputs.issueLabels,
        issueType: inputs.issueType
      })
    }
  } catch (e: unknown) {
    core.setFailed((e as Error)?.message ?? 'Unknown error occurred')
  }
}
