# Changelog

## [5.4.2](https://github.com/oke-py/npm-audit-action/compare/v5.4.1...v5.4.2) (2026-09-07)


### Bug Fixes

* **deps:** bump undici to 6.28.0 ([#402](https://github.com/oke-py/npm-audit-action/issues/402)) ([99e6174](https://github.com/oke-py/npm-audit-action/commit/99e6174b9ccfccfdc06f73aa115c78b74c21b944))
* honour GITHUB_API_URL when constructing the Octokit client ([#407](https://github.com/oke-py/npm-audit-action/issues/407)) ([6deefde](https://github.com/oke-py/npm-audit-action/commit/6deefde1516b06f146bd93c50742a707ca63db11))


### Build System

* **deps-dev:** bump the npm-development group across 1 directory with 6 updates ([#410](https://github.com/oke-py/npm-audit-action/issues/410)) ([fe68137](https://github.com/oke-py/npm-audit-action/commit/fe68137d0825611dd4bce09262541d0f3cbcc76a))
* **deps-dev:** bump the npm-development group with 2 updates ([#397](https://github.com/oke-py/npm-audit-action/issues/397)) ([d97af5c](https://github.com/oke-py/npm-audit-action/commit/d97af5c8cc07b4494b758672861d23d09912b04f))
* **deps-dev:** bump the npm-development group with 4 updates ([#405](https://github.com/oke-py/npm-audit-action/issues/405)) ([7b1ebed](https://github.com/oke-py/npm-audit-action/commit/7b1ebed4af95c982609e6de4ebeac2ebeb9a3625))
* **deps:** bump actions/setup-node from 6.4.0 to 7.0.0 ([#398](https://github.com/oke-py/npm-audit-action/issues/398)) ([24c84ed](https://github.com/oke-py/npm-audit-action/commit/24c84ed9fc3defb3518e3ead5159f258f169f9dc))
* **deps:** bump the actions-minor group across 1 directory with 3 updates ([#404](https://github.com/oke-py/npm-audit-action/issues/404)) ([e7823a0](https://github.com/oke-py/npm-audit-action/commit/e7823a0462a75da42f8c932e132e84eb11ebc181))

## [5.4.1](https://github.com/oke-py/npm-audit-action/compare/v5.4.0...v5.4.1) (2026-07-28)


### Documentation

* document how to release build-only changes ([#392](https://github.com/oke-py/npm-audit-action/issues/392)) ([0e21f44](https://github.com/oke-py/npm-audit-action/commit/0e21f441bf268e62ba61b6aa31668b93f8db55e9))


### Build System

* **deps-dev:** bump the npm-development group with 2 updates ([#387](https://github.com/oke-py/npm-audit-action/issues/387)) ([4fad159](https://github.com/oke-py/npm-audit-action/commit/4fad159aa0c53eb8e69c669e0c53b12e57c82eac))
* **deps-dev:** bump the npm-development group with 3 updates ([#385](https://github.com/oke-py/npm-audit-action/issues/385)) ([e2f85b1](https://github.com/oke-py/npm-audit-action/commit/e2f85b1491b796122234598bc933f58e80a3a74e))
* **deps-dev:** bump typescript from 6.0.3 to 7.0.2 ([#386](https://github.com/oke-py/npm-audit-action/issues/386)) ([74dfaee](https://github.com/oke-py/npm-audit-action/commit/74dfaee964e003e4a00acb5e4a0fc1ab623e8c81))
* **deps:** bump the actions-minor group across 1 directory with 3 updates ([#388](https://github.com/oke-py/npm-audit-action/issues/388)) ([eb8a8a9](https://github.com/oke-py/npm-audit-action/commit/eb8a8a90ff40cb258059997f9d76c26762033b52))
* replace rollup with rolldown ([#391](https://github.com/oke-py/npm-audit-action/issues/391)) ([5a23967](https://github.com/oke-py/npm-audit-action/commit/5a239673fd3f25b4dfecf85cea446816c0d950c5))

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
