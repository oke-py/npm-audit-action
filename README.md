# npm audit action

GitHub Action to run `npm audit`

If vulnerabilities are found by `npm audit`, it creates the following GitHub Issue.

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

on: [push, pull_request]
# on:
#   schedule:
#     - cron: '0 10 * * *'

jobs:
  scan:
    name: npm audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
      - name: install dependencies
        run: npm ci
      - uses: oke-py/npm-audit-action@v0.1.0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          issue_assignees: oke-py
          issue_labels: vulnerability,test
```
