import * as core from '@actions/core'
import type { IssueOption } from './interface.js'

export function getIssueOption(body: string, issueTitle?: string): IssueOption {
  let assignees: string[] | undefined
  let labels: string[] | undefined

  const issueAssigneesInput = core.getInput('issue_assignees', {
    trimWhitespace: true
  })
  if (issueAssigneesInput) {
    const parsed = issueAssigneesInput
      .split(',')
      .map((assignee) => assignee.trim())
      .filter(Boolean)
    if (parsed.length > 0) {
      assignees = parsed
    }
  }
  const issueLabelsInput = core.getInput('issue_labels', {
    trimWhitespace: true
  })
  if (issueLabelsInput) {
    const parsed = issueLabelsInput
      .split(',')
      .map((label) => label.trim())
      .filter(Boolean)
    if (parsed.length > 0) {
      labels = parsed
    }
  }

  return {
    title: issueTitle ?? core.getInput('issue_title', { trimWhitespace: true }),
    body,
    assignees,
    labels
  }
}

export type GetIssuesFunc = (options: {
  owner: string
  repo: string
  state: 'open' | 'closed' | 'all' | undefined
  [key: string]: string | undefined // Allow additional properties
}) => Promise<{ data: Array<{ title: string; number: number }> }>

export async function getExistingIssueNumber(
  getIssues: GetIssuesFunc,
  repo: {
    owner: string
    repo: string
  },
  issueTitle?: string
): Promise<number | null> {
  const { data: issues } = await getIssues({
    ...repo,
    state: 'open'
  })

  const iss = issues
    .filter(
      (i) =>
        i.title ===
        (issueTitle ?? core.getInput('issue_title', { trimWhitespace: true }))
    )
    .shift()

  return iss?.number ?? null
}
