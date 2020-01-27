# npm audit action

[![Coverage Status](https://coveralls.io/repos/github/oke-py/npm-audit-action/badge.svg?branch=master)](https://coveralls.io/github/oke-py/npm-audit-action?branch=master)

GitHub Action to run `npm audit`

## Feature

### Create a Pull Request comment

If vulnerabilities are found by `npm audit`, Action triggered by PR creates a comment.

### Create an Issue

If vulnerabilities are found by `npm audit`, Action triggered by push, schedule creates the following GitHub Issue.

![image](https://github.com/oke-py/npm-audit-action/blob/master/issue.png)

## Usage

### Inputs

|Parameter|Required|Default Value|Description|
|:--:|:--:|:--:|:--|
|issue_assignees|false|N/A|Issue assignees (separated by commma)|
|issue_labels|false|N/A|Issue labels (separated by commma)|
|issue_title|false|npm audit found vulnerabilities|Issue title|
|token|true|N/A|GitHub Access Token.<br>${{ secrets.GITHUB_TOKEN }} is recommended.|

### Outputs

N/A

## Example Workflow

```yaml
name: npm audit

on:
  pull_request:
  push:
    branches:
      - master
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
      - uses: oke-py/npm-audit-action@v1.1.0
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          issue_assignees: oke-py
          issue_labels: vulnerability,test
```

- - -

This action is inspired by [homoluctus/gitrivy](https://github.com/homoluctus/gitrivy).
