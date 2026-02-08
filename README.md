# npm audit action

[![Coverage Status](https://coveralls.io/repos/github/oke-py/npm-audit-action/badge.svg?branch=main)](https://coveralls.io/github/oke-py/npm-audit-action?branch=main)

GitHub Action that runs `npm audit` and reports vulnerabilities.

## Features

- Post a pull request comment when vulnerabilities are found
- Create a GitHub issue on pushes or scheduled runs when vulnerabilities are found

![Issue example](https://github.com/oke-py/npm-audit-action/blob/main/issue.png)

## Usage

### Permissions

When creating comments or issues, grant write permissions:

```yaml
permissions:
  contents: read
  issues: write
  pull-requests: write
```

### Inputs

| Parameter | Required | Default | Description |
| :-- | :--: | :--: | :-- |
| `audit_level` | false | `low` | Value for `npm audit --audit-level` |
| `create_issues` | false | `true` | Create issues when vulnerabilities are found |
| `create_pr_comments` | false | `true` | Create pull request comments when vulnerabilities are found |
| `dedupe_issues` | false | `false` | De-dupe against open issues |
| `fail_on_vulnerabilities` | false | `true` | Fail the action when vulnerabilities are found |
| `github_context` | false | `${{ toJson(github) }}` | The `github` context |
| `github_token` | true | N/A | GitHub Access Token. Use `${{ secrets.GITHUB_TOKEN }}` |
| `issue_assignees` | false | N/A | Issue assignees (comma-separated) |
| `issue_labels` | false | N/A | Issue labels (comma-separated) |
| `issue_title` | false | `npm audit found vulnerabilities` | Issue title |
| `json_flag` | false | `false` | Run `npm audit` with `--json` |
| `production_flag` | false | `false` | Run `npm audit` with `--omit=dev` |
| `working_directory` | false | N/A | Directory containing `package.json` |

### Outputs

| Parameter | Description |
| :-- | :-- |
| `npm_audit` | The `npm audit` report output as text |

### Example Workflow

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
    permissions:
      contents: read
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v6
      - name: install dependencies
        run: npm ci
      - uses: oke-py/npm-audit-action@v3
        with:
          audit_level: moderate
          github_token: ${{ secrets.GITHUB_TOKEN }}
          issue_assignees: oke-py
          issue_labels: vulnerability,test
          dedupe_issues: true
```

---

This action is inspired by [homoluctus/gitrivy](https://github.com/homoluctus/gitrivy).
