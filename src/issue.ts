import * as core from '@actions/core'
import {IssueOption} from './interface'

export function getIssueOption(body: string): IssueOption {
  let assignees
  let labels

  if (core.getInput('issue_assignees')) {
    assignees = core.getInput('issue_assignees').replace(/\s+/g, '').split(',')
  }
  if (core.getInput('issue_labels')) {
    labels = core.getInput('issue_labels').replace(/\s+/g, '').split(',')
  }

  return {
    title: core.getInput('issue_title'),
    body,
    assignees,
    labels
  }
}
