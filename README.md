# npm audit action

GitHub Action to run `npm audit`

## Usage

### Inputs

|Parameter|Required|Default Value|Description|
|:--:|:--:|:--:|:--|
|issue_assignees|false|N/A|Issue assignees (separeted by commma)|
|issue_title|false|npm audit found vulnerabilities|Issue title|
|token|true|N/A|GitHub Access Token.<br>${{ secrets.GITHUB_TOKEN }} is recommended.|

### Outputs

N/A

## Example Workflow

TBD
