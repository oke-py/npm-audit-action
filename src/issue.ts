import * as core from '@actions/core'
import {IssueOption} from './interface'

export function getIssueOption(body: string): IssueOption {
  let assignees
  let labels

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
}) => Promise<{data: {title: string; number: number}[]}>

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

  return iss === undefined ? null : iss.number
}
