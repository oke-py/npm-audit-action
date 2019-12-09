import * as core from '@actions/core'
import {IssueOption} from './interface'

export function getIssueOption(body: string): IssueOption {
  return {
    title: core.getInput('issue_title'),
    body,
    assignees: core
      .getInput('issue_assignees')
      .replace(/\s+/g, '')
      .split(','),
    labels: core
      .getInput('issue_labels')
      .replace(/\s+/g, '')
      .split(',')
  }
}
