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
    if (
      !['critical', 'high', 'moderate', 'low', 'info', 'none'].includes(
        auditLevel
      )
    ) {
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
    core.setOutput('npm_audit', audit.stdout)

    if (audit.foundVulnerability()) {
      // vulnerabilities are found

      // get GitHub information
      const ctx = JSON.parse(core.getInput('github_context'))
      const token: string = core.getInput('github_token', {required: true})
      const octokit = new Octokit({
        auth: token
      })

      if (ctx.event_name === 'pull_request') {
        const createPRComments = core.getInput('create_pr_comments')
        if (!['true', 'false'].includes(createPRComments)) {
          throw new Error('Invalid input: create_pr_comments')
        }

        if (createPRComments === 'true') {
          await pr.createComment(
            token,
            github.context.repo.owner,
            github.context.repo.repo,
            ctx.event.number,
            audit.strippedStdout()
          )
        }
        core.setFailed('This repo has some vulnerabilities')
        return
      } else {
        core.debug('open an issue')
        const createIssues = core.getInput('create_issues')
        if (!['true', 'false'].includes(createIssues)) {
          throw new Error('Invalid input: create_issues')
        }

        if (createIssues === 'false') {
          core.setFailed('This repo has some vulnerabilities')
          return
        }

        // remove control characters and create a code block
        const issueBody = audit.strippedStdout()
        const option: IssueOption = issue.getIssueOption(issueBody)

        const existingIssueNumber =
          core.getInput('dedupe_issues') === 'true'
            ? await issue.getExistingIssueNumber(
                octokit.rest.issues.listForRepo,
                github.context.repo
              )
            : null

        if (existingIssueNumber !== null) {
          const {data: createdComment} =
            await octokit.rest.issues.createComment({
              ...github.context.repo,
              issue_number: existingIssueNumber,
              body: option.body
            })
          core.debug(`comment ${createdComment.url}`)
        } else {
          const {data: createdIssue} = await octokit.rest.issues.create({
            ...github.context.repo,
            ...option
          })
          core.debug(`#${createdIssue.number}`)
        }
        core.setFailed('This repo has some vulnerabilities')
      }
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      core.setFailed(e.message)
    }
  }
}

run()
