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
|create_issues|false|true|Flag to create issues when vulnerabilities are found|
|create_pr_comments|false|true|Flag to create pr comments when vulnerabilities are found|
|dedupe_issues|false|false|Flag to de-dupe against open issues|
|github_context|false|`${{ toJson(github) }}`|The `github` context|
|github_token|true|N/A|GitHub Access Token.<br>${{ secrets.GITHUB_TOKEN }} is recommended.|
|issue_assignees|false|N/A|Issue assignees (separated by commma)|
|issue_labels|false|N/A|Issue labels (separated by commma)|
|issue_title|false|npm audit found vulnerabilities|Issue title|
|json_flag|false|false|Run `npm audit` with `--json`|
|production_flag|false|false|Run `npm audit` with `--omit=dev`|
|working_directory|false|N/A|The directory which contains package.json|

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
      - uses: actions/checkout@v3
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

## Development

### Running Tests

This project uses [Vitest](https://vitest.dev/) for testing. To run the tests, use the following command:

```bash
npm run test
```

Vitest will execute all test files and provide a detailed report of the results. For coverage reports, you can use:

```bash
npm run test:coverage
```

Ensure all dependencies are installed before running the tests:

```bash
npm ci
```

- - -

This action is inspired by [homoluctus/gitrivy](https://github.com/homoluctus/gitrivy).
