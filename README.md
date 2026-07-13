# npm audit action

[![Coverage Status](https://coveralls.io/repos/github/oke-py/npm-audit-action/badge.svg?branch=main)](https://coveralls.io/github/oke-py/npm-audit-action?branch=main)

GitHub Action that runs `npm audit` and reports vulnerabilities.

## Features

- Post a pull request comment when vulnerabilities are found
- Create a GitHub issue on pushes or scheduled runs when vulnerabilities are found

![Issue example](https://github.com/oke-py/npm-audit-action/blob/main/issue.png)

## Scope: when to use this action

This action runs `npm audit` as a CI gate and reports the results. It is intentionally small:

- **No external service or token required** — nothing leaves GitHub
- **Blocks vulnerabilities at pull request time**, before they are merged
- **Detection and reporting only**

It does not aim to replace dedicated tools, and works well alongside them:

- For automated remediation (dependency update PRs), use [Dependabot security updates](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates) or `npm audit fix`
- For deeper analysis such as reachability, license compliance, or container scanning, use a dedicated service like Snyk

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
| `dedupe_comments` | false | `false` | Skip commenting on the existing issue when the report is unchanged from the last one posted by this action. Effective only with `dedupe_issues: true` |
| `dedupe_issues` | false | `false` | De-dupe against open issues |
| `fail_on_vulnerabilities` | false | `true` | Fail the action when vulnerabilities are found |
| `github_token` | true | N/A | GitHub Access Token. Use `${{ secrets.GITHUB_TOKEN }}` |
| `issue_assignees` | false | N/A | Issue assignees (comma-separated) |
| `issue_labels` | false | N/A | Issue labels (comma-separated) |
| `issue_title` | false | `npm audit found vulnerabilities` | Issue title |
| `issue_type` | false | N/A | Issue type (e.g. `Bug`, `Task`). Requires [issue types](https://docs.github.com/en/issues/tracking-your-work-with-issues/configuring-issues/managing-issue-types-in-an-organization) to be enabled on the organization |
| `json_flag` | false | `false` | Run `npm audit` with `--json` |
| `production_flag` | false | `false` | Run `npm audit` with `--omit=dev` |
| `registry` | false | N/A | Registry URL passed to `npm audit` via the `--registry` flag (e.g. `https://registry.npmjs.org`) |
| `report_format` | false | `text` | Format of the report posted to issues and PR comments. `text` posts the `npm audit` output in a code block; `markdown` posts a summary and a table built from the JSON report. `markdown` forces `npm audit --json`, so the `npm_audit` output and the action log contain the JSON report |
| `resolve_pr_comments` | false | `false` | Edit previous report comments on the pull request (collapse the report and note the resolution) when vulnerabilities are no longer found. Effective only with `create_pr_comments: true` |
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
    runs-on: ubuntu-slim
    permissions:
      contents: read
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - name: install dependencies
        run: npm ci
      - uses: oke-py/npm-audit-action@v5
        with:
          audit_level: moderate
          github_token: ${{ secrets.GITHUB_TOKEN }}
          issue_assignees: oke-py
          issue_labels: vulnerability,test
          dedupe_issues: true
          dedupe_comments: true
```

### Monorepos

`working_directory` accepts a single directory. To audit multiple packages, use a [matrix](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs):

```yaml
jobs:
  scan:
    strategy:
      matrix:
        workdir: [packages/a, packages/b, tools/c]
    runs-on: ubuntu-slim
    permissions:
      contents: read
      issues: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - name: install dependencies
        run: npm ci
        working-directory: ${{ matrix.workdir }}
      - uses: oke-py/npm-audit-action@v5
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          working_directory: ${{ matrix.workdir }}
          issue_title: 'npm audit found vulnerabilities (${{ matrix.workdir }})'
          dedupe_issues: true
```

Including the directory in `issue_title` keeps `dedupe_issues` working per package.

---

This action is inspired by [homoluctus/gitrivy](https://github.com/homoluctus/gitrivy).
