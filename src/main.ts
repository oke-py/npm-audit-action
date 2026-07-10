import * as fs from 'node:fs'
import * as core from '@actions/core'
import { Octokit } from '@octokit/rest'
import { Audit } from './audit.js'
import { getInputs, type ReportFormat } from './inputs.js'
import { buildMarkdownReport } from './report.js'
import { REPORT_MARKER_LENGTH } from './issue.js'
import { handleIssueFlow } from './issue-flow.js'
import { RESOLVED_COMMENT_RESERVED_LENGTH } from './pr.js'
import { handlePullRequest, resolvePullRequestComments } from './pr-flow.js'

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
      'Failed to build the markdown report from the `npm audit --json` output; falling back to the text report'
    )
  }
  return audit.strippedStdout(reservedLength)
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
    const audit = new Audit()
    audit.run(
      inputs.auditLevel,
      inputs.productionFlag,
      inputs.jsonFlag || inputs.reportFormat === 'markdown',
      inputs.registry
    )
    core.info(audit.stdout)
    core.setOutput('npm_audit', audit.stdout)

    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      if (audit.foundVulnerability()) {
        const octokit = new Octokit({
          auth: inputs.token
        })
        await handlePullRequest(
          octokit,
          getPullRequestNumber(),
          buildReportBody(
            audit,
            inputs.reportFormat,
            inputs.resolvePRComments ? RESOLVED_COMMENT_RESERVED_LENGTH : 0
          ),
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

    if (audit.foundVulnerability()) {
      // vulnerabilities are found

      // get GitHub information
      const octokit = new Octokit({
        auth: inputs.token
      })

      core.debug('open an issue')
      const auditOutput = buildReportBody(
        audit,
        inputs.reportFormat,
        inputs.dedupeComments ? REPORT_MARKER_LENGTH : 0
      )
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
