# Changelog

## [5.4.0](https://github.com/oke-py/npm-audit-action/compare/v5.3.0...v5.4.0) (2026-07-14)


### Features

* add ignore_ghsas input to exclude advisories from the result ([#379](https://github.com/oke-py/npm-audit-action/issues/379)) ([70d3d64](https://github.com/oke-py/npm-audit-action/commit/70d3d6417e6cf175b3a11e12617859ce0dda5d0d))

## [5.3.0](https://github.com/oke-py/npm-audit-action/compare/v5.2.0...v5.3.0) (2026-07-11)


### Features

* add report_format input to post the report as markdown ([e4c6ac2](https://github.com/oke-py/npm-audit-action/commit/e4c6ac24853c880ac73b7e63d8c9b1224e3c63cb)), closes [#201](https://github.com/oke-py/npm-audit-action/issues/201)

## [5.2.0](https://github.com/oke-py/npm-audit-action/compare/v5.1.0...v5.2.0) (2026-07-09)


### Features

* add dedupe_comments input to skip unchanged report comments ([f6a1764](https://github.com/oke-py/npm-audit-action/commit/f6a176462dc248a43eb61b0ca8cbe3617ed24f9f)), closes [#107](https://github.com/oke-py/npm-audit-action/issues/107)
* add resolve_pr_comments input to mark report comments resolved ([32066d2](https://github.com/oke-py/npm-audit-action/commit/32066d2e7f83eac196a63a0cef2338063e0a673d)), closes [#27](https://github.com/oke-py/npm-audit-action/issues/27)

## [5.1.0](https://github.com/oke-py/npm-audit-action/compare/v5.0.1...v5.1.0) (2026-07-08)


### Features

* add issue_type input to set the issue type ([4fef84c](https://github.com/oke-py/npm-audit-action/commit/4fef84c0752d4e789c8e3a13abc3fb824d28844c)), closes [#273](https://github.com/oke-py/npm-audit-action/issues/273)
* add registry input to run npm audit against a specific registry ([f661785](https://github.com/oke-py/npm-audit-action/commit/f66178566bac40f7b191c9c84fd8944c5752ff39)), closes [#169](https://github.com/oke-py/npm-audit-action/issues/169)


### Bug Fixes

* truncate audit report exceeding GitHub body length limit ([bfe1366](https://github.com/oke-py/npm-audit-action/commit/bfe13668808704d604597cf9812c9d906e6bf859)), closes [#170](https://github.com/oke-py/npm-audit-action/issues/170)

## [5.0.1](https://github.com/oke-py/npm-audit-action/compare/v5.0.0...v5.0.1) (2026-07-07)


### Bug Fixes

* spawn npm via shell on Windows to avoid EINVAL ([df29ccc](https://github.com/oke-py/npm-audit-action/commit/df29cccf9cb6f88fd0231a1977e5788056d40276)), closes [#212](https://github.com/oke-py/npm-audit-action/issues/212)

## [5.0.0](https://github.com/oke-py/npm-audit-action/compare/v4.0.2...v5.0.0) (2026-07-07)


### ⚠ BREAKING CHANGES

* the github_context input has been removed. The action now reads event information from the runner environment. Remove `github_context: ${{ toJson(github) }}` from your workflow if present.

### Bug Fixes

* remove github_context input in favor of the runner environment ([805c161](https://github.com/oke-py/npm-audit-action/commit/805c16108e10999c45f83e7ece1043769a314bde)), closes [#343](https://github.com/oke-py/npm-audit-action/issues/343)
