import * as core from '@actions/core'
import {IssueOption} from './interface.js'

export function getIssueOption(body: string): IssueOption {
  let assignees: string[] | undefined
  let labels: string[] | undefined

  if (core.getInput('issue_assignees')) {
    assignees = core.getInput('issue_assignees').replace(/\s+/g, '').split(',')
  }
  if (core.getInput('issue_labels')) {
    labels = core
      .getInput('issue_labels')
      .split(',')
      .map(label => label.trim())
  }

  return {
    title: core.getInput('issue_title'),
    body,
    assignees,
    labels
  }
}

export type GetIssuesFunc = (options: {
  owner: string
  repo: string
  state: 'open' | 'closed' | 'all' | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any // Allow additional properties
}) => Promise<{data: Array<{title: string; number: number}>}>

export async function getExistingIssueNumber(
  getIssues: GetIssuesFunc,
  repo: {
    owner: string
    repo: string
  }
): Promise<number | null> {
  const {data: issues} = await getIssues({
    ...repo,
    state: 'open'
  })

  const iss = issues
    .filter(i => i.title === core.getInput('issue_title'))
    .shift()

  return iss?.number ?? null
}
