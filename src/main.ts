import * as core from '@actions/core'
import * as github from '@actions/github'
import stripAnsi from 'strip-ansi'
import Octokit, {IssuesCreateResponse} from '@octokit/rest'
import {spawnSync, SpawnSyncReturns} from 'child_process'

async function run(): Promise<void> {
  try {
    const result: SpawnSyncReturns<string> = spawnSync('npm', ['audit'], {
      encoding: 'utf-8'
    })

    if (result.stderr && result.stderr.length > 0) {
      throw new Error(result.stderr)
    }

    core.info(result.stdout)

    if (result.status === 0) {
      // vulnerabilities are not found
      return
    }

    core.debug('open an issue')
    const token: string = core.getInput('token', {required: true})
    const client: Octokit = new github.GitHub(token)

    // remove control characters and create a code block
    const issueBody = `\`\`\`\n${stripAnsi(result.stdout)}\n\`\`\``
    const issueOptions = {
      title: 'npm audit found vulnerabilities',
      body: issueBody
    }
    const {
      data: issue
    }: Octokit.Response<IssuesCreateResponse> = await client.issues.create({
      ...github.context.repo,
      ...issueOptions
    })
    core.debug(`#${issue.number}`)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
