# Changelog

## [5.0.0](https://github.com/oke-py/npm-audit-action/compare/v4.0.2...v5.0.0) (2026-07-07)


### ⚠ BREAKING CHANGES

* the github_context input has been removed. The action now reads event information from the runner environment. Remove `github_context: ${{ toJson(github) }}` from your workflow if present.

### Bug Fixes

* remove github_context input in favor of the runner environment ([805c161](https://github.com/oke-py/npm-audit-action/commit/805c16108e10999c45f83e7ece1043769a314bde)), closes [#343](https://github.com/oke-py/npm-audit-action/issues/343)
