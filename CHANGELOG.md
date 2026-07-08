# Changelog

## [5.1.0](https://github.com/oke-py/npm-audit-action/compare/v5.0.1...v5.1.0) (2026-07-08)


### Features

* add issue_type input to set the issue type ([b46d237](https://github.com/oke-py/npm-audit-action/commit/b46d237d580f1a1ac0503a0ce0e48e7fcbabd321))
* add issue_type input to set the issue type ([4fef84c](https://github.com/oke-py/npm-audit-action/commit/4fef84c0752d4e789c8e3a13abc3fb824d28844c)), closes [#273](https://github.com/oke-py/npm-audit-action/issues/273)
* add registry input to run npm audit against a specific registry ([f8c39f7](https://github.com/oke-py/npm-audit-action/commit/f8c39f7ae407495327e64fb3ac954c5b1b88aeee))
* add registry input to run npm audit against a specific registry ([f661785](https://github.com/oke-py/npm-audit-action/commit/f66178566bac40f7b191c9c84fd8944c5752ff39)), closes [#169](https://github.com/oke-py/npm-audit-action/issues/169)


### Bug Fixes

* truncate audit report exceeding GitHub body length limit ([bfe1366](https://github.com/oke-py/npm-audit-action/commit/bfe13668808704d604597cf9812c9d906e6bf859)), closes [#170](https://github.com/oke-py/npm-audit-action/issues/170)

## [5.0.1](https://github.com/oke-py/npm-audit-action/compare/v5.0.0...v5.0.1) (2026-07-07)


### Bug Fixes

* spawn npm via shell on Windows to avoid EINVAL ([9d6a450](https://github.com/oke-py/npm-audit-action/commit/9d6a4506ded134b7f6c49e99a8cc07685f017704))
* spawn npm via shell on Windows to avoid EINVAL ([df29ccc](https://github.com/oke-py/npm-audit-action/commit/df29cccf9cb6f88fd0231a1977e5788056d40276)), closes [#212](https://github.com/oke-py/npm-audit-action/issues/212)

## [5.0.0](https://github.com/oke-py/npm-audit-action/compare/v4.0.2...v5.0.0) (2026-07-07)


### ⚠ BREAKING CHANGES

* the github_context input has been removed. The action now reads event information from the runner environment. Remove `github_context: ${{ toJson(github) }}` from your workflow if present.

### Bug Fixes

* remove github_context input in favor of the runner environment ([805c161](https://github.com/oke-py/npm-audit-action/commit/805c16108e10999c45f83e7ece1043769a314bde)), closes [#343](https://github.com/oke-py/npm-audit-action/issues/343)
