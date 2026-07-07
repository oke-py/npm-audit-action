# Changelog

## [5.0.1](https://github.com/oke-py/npm-audit-action/compare/v5.0.0...v5.0.1) (2026-07-07)


### Bug Fixes

* spawn npm via shell on Windows to avoid EINVAL ([9d6a450](https://github.com/oke-py/npm-audit-action/commit/9d6a4506ded134b7f6c49e99a8cc07685f017704))
* spawn npm via shell on Windows to avoid EINVAL ([df29ccc](https://github.com/oke-py/npm-audit-action/commit/df29cccf9cb6f88fd0231a1977e5788056d40276)), closes [#212](https://github.com/oke-py/npm-audit-action/issues/212)

## [5.0.0](https://github.com/oke-py/npm-audit-action/compare/v4.0.2...v5.0.0) (2026-07-07)


### ⚠ BREAKING CHANGES

* the github_context input has been removed. The action now reads event information from the runner environment. Remove `github_context: ${{ toJson(github) }}` from your workflow if present.

### Bug Fixes

* remove github_context input in favor of the runner environment ([805c161](https://github.com/oke-py/npm-audit-action/commit/805c16108e10999c45f83e7ece1043769a314bde)), closes [#343](https://github.com/oke-py/npm-audit-action/issues/343)
