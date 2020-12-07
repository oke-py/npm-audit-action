import * as core from '@actions/core'
import * as github from '@actions/github'
import {Octokit} from '@octokit/rest'
import {Audit} from './audit'
import {IssueOption} from './interface'
import * as issue from './issue'
import * as pr from './pr'
import * as workdir from './workdir'

export async function run(): Promise<void> {
  try {
    // move to working directory
    const workingDirectory = core.getInput('working_directory')
    if (workingDirectory) {
      if (!workdir.isValid(workingDirectory)) {
        throw new Error('Invalid input: working_directory')
      }
      process.chdir(workingDirectory)
    }
    core.info(`Current working directory: ${process.cwd()}`)

    // get audit-level
    const auditLevel = core.getInput('audit_level', {required: true})
    if (!['critical', 'high', 'moderate', 'low'].includes(auditLevel)) {
      throw new Error('Invalid input: audit_level')
    }

    const productionFlag = core.getInput('production_flag', {required: false})
    if (!['true', 'false'].includes(productionFlag)) {
      throw new Error('Invalid input: production_flag')
    }

    const jsonFlag = core.getInput('json_flag', {required: false})
    if (!['true', 'false'].includes(jsonFlag)) {
      throw new Error('Invalid input: json_flag')
    }


    // run `npm audit`
    const audit = new Audit()
    audit.run(auditLevel, productionFlag, jsonFlag)
    core.info(audit.stdout)

    if (audit.foundVulnerability()) {
      // vulnerabilities are found

      // get GitHub information
      const ctx = JSON.parse(core.getInput('github_context'))
      const token: string = core.getInput('github_token', {required: true})
      const octokit = new Octokit({
        auth: token
      })

      if (ctx.event_name === 'pull_request') {
        await pr.createComment(
          token,
          github.context.repo.owner,
          github.context.repo.repo,
          ctx.event.number,
          audit.strippedStdout()
        )
        core.setFailed('This repo has some vulnerabilities')
        return
      } else {
        core.debug('open an issue')
        // remove control characters and create a code block
        const issueBody = audit.strippedStdout()
        const option: IssueOption = issue.getIssueOption(issueBody)

        const existingIssueNumber =
          core.getInput('dedupe_issues') === 'true'
            ? await issue.getExistingIssueNumber(
                octokit.issues.listForRepo,
                github.context.repo
              )
            : null

        if (existingIssueNumber !== null) {
          const {data: createdComment} = await octokit.issues.createComment({
            ...github.context.repo,
            issue_number: existingIssueNumber,
            body: option.body
          })
          core.debug(`comment ${createdComment.url}`)
        } else {
          const {data: createdIssue} = await octokit.issues.create({
            ...github.context.repo,
            ...option
          })
          core.debug(`#${createdIssue.number}`)
        }
        core.setFailed('This repo has some vulnerabilities')
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
