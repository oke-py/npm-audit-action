# Development

## Prerequisites

- Node.js 24 or newer
- npm (use `npm ci` for reproducible installs)

## Project Layout

- `action.yml`: Action metadata and inputs/outputs
- `src/`: TypeScript source code
- `dist/`: Bundled action output (committed)
- `__tests__/`: Vitest tests
- `__fixtures__/`: test fixtures

## Common Commands

```bash
npm ci
npm run format:write
npm run format:check
npm run lint
npm run test
npm run test:coverage
npm run package
npm run all
npm run bundle
```

## TypeScript Configuration

- Strict type checking is enabled in `tsconfig.base.json`
- Module settings use `NodeNext`
- Target runtime is `ES2022`

## Formatting and Linting

- Use Biome for formatting and linting
- `npm run format:write` updates formatting
- `npm run lint` runs Biome linting

## Testing

- Uses Vitest
- `npm run test` runs the test suite
- `npm run test:coverage` generates coverage in `coverage/`

## Packaging

- Bundling is done via Rollup
- `npm run package` builds `dist/index.js`
- The action runs from `dist/index.js`
- The `update dist/index.js` workflow rebuilds `dist/` on pull requests
  and commits changes back to the PR branch, so `dist/` stays in sync on
  every commit on `main`
- For PRs from forks the workflow cannot push; run `npm run bundle` and
  commit the result instead

## Release Process

Releases are automated with
[release-please](https://github.com/googleapis/release-please).
The same flow covers major, minor, and patch releases.

1. Merge PRs to `main` with Conventional Commit messages.
   `fix:` produces a patch release, `feat:` a minor release, and
   `feat!:` or a `BREAKING CHANGE:` footer a major release.
1. The `release-please` workflow maintains a release PR that updates
   `package.json`, `package-lock.json`, and `CHANGELOG.md`.
1. For major releases, update usage references to the new major tag
   (README and workflows) before merging the release PR.
1. Merge the release PR. This creates the version tag and the GitHub
   Release, and moves the major tag (e.g. `v4`).

Notes:

- CI may not start automatically on the release PR because it is
  created with `GITHUB_TOKEN`. Close and reopen the PR to trigger CI.
- The `git-tag` workflow still moves the major tag for manually
  published releases.

## Git Workflow

- Use feature branches (`feature/`, `fix/`, `docs/`, `refactor/`).
- Follow Conventional Commits for messages: `type(scope): message`.
- Keep commit messages and PR text in English.

## Pull Requests

- Use clear titles and descriptions in English.
- Describe what changed, why, and any testing performed.
- Reference issues with GitHub keywords when applicable.

## CI Expectations

- PRs must pass formatting, linting, tests, and packaging checks.
- The `update dist/index.js` workflow keeps `dist/` in sync on the PR
  branch. Commits it pushes do not trigger new workflow runs
  (a `GITHUB_TOKEN` limitation); re-run the PR checks manually if they
  need to cover the dist commit.
- The `Licensed` workflow (licensee/licensed-ci) updates and verifies
  cached dependency license metadata on PRs and pushes to `main`.

## Supply Chain Security

- `.npmrc` sets `min-release-age=7`, so `npm install` and `npm update`
  only resolve versions published at least 7 days ago. `npm ci` is not
  affected because it installs from `package-lock.json`.
- Dependabot applies a matching 7-day `cooldown` to dependency updates.
- GitHub Actions in workflows are pinned to full commit SHAs.
  Dependabot keeps the pinned SHAs up to date.

## References

- `@actions/core`: https://www.npmjs.com/package/@actions/core
- `@octokit/rest`: https://www.npmjs.com/package/@octokit/rest
- GitHub REST API v3: https://developer.github.com/v3/
