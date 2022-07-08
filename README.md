# npm audit action

[![Coverage Status](https://coveralls.io/repos/github/oke-py/npm-audit-action/badge.svg?branch=main)](https://coveralls.io/github/oke-py/npm-audit-action?branch=main)

GitHub Action to run `npm audit`

## Feature

### Create a Pull Request comment

If vulnerabilities are found by `npm audit`, Action triggered by PR creates a comment.

### Create an Issue

If vulnerabilities are found by `npm audit`, Action triggered by push, schedule creates the following GitHub Issue.

![image](https://github.com/oke-py/npm-audit-action/blob/main/issue.png)

## Usage

### Inputs

|Parameter|Required|Default Value|Description|
|:--:|:--:|:--:|:--|
|audit_level|false|low|The value of `--audit-level` flag|
|production_flag|false|false|Runnning `npm audit` with `--omit=dev`|
|json_flag|false|false|Runnning `npm audit` with `--json`|
|issue_assignees|false|N/A|Issue assignees (separated by commma)|
|issue_labels|false|N/A|Issue labels (separated by commma)|
|issue_title|false|npm audit found vulnerabilities|Issue title|
|github_token|true|N/A|GitHub Access Token.<br>${{ secrets.GITHUB_TOKEN }} is recommended.|
|working_directory|false|N/A|The directory which contains package.json (since v1.4.0)|
|dedupe_issues|false|false|If 'true', action will not create a new issue when one is already open (since v1.5.0)|
|create_issues|false|true|If 'false', action will not create a new issue even if vulnerabilities are found (since v1.8.0)|
|create_pr_comments|false|true|If 'false', action will not create a pr comment even if vulnerabilities are found (since v1.8.0)|

### Outputs

|Parameter name|Description|
|:--:|:--|
|npm_audit|The output of the npm audit report in a text format|

## Example Workflow

```yaml
name: npm audit

on:
  pull_request:
  push:
    branches:
      - main
      - 'releases/*'
# on:
#   schedule:
#     - cron: '0 10 * * *'

jobs:
  scan:
    name: npm audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: install dependencies
        run: npm ci
      - uses: oke-py/npm-audit-action@v2
        with:
          audit_level: moderate
          github_token: ${{ secrets.GITHUB_TOKEN }}
          issue_assignees: oke-py
          issue_labels: vulnerability,test
          dedupe_issues: true
```

- - -

This action is inspired by [homoluctus/gitrivy](https://github.com/homoluctus/gitrivy).
