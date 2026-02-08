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
- After merging to `main`, the `update-dist` workflow updates `dist/index.js`
- Create releases from the commit that includes the updated `dist/index.js`

## Release Process

### Major Releases

1. Create a feature branch for the major bump.
2. Update `package.json` and `package-lock.json` to the new major version.
3. Update usage references to the new major tag (README and workflows).
4. Merge to `main` and wait for the `update-dist` workflow to update `dist/index.js`.
5. Create a GitHub Release from the commit that includes the updated `dist/index.js`.
6. The `git-tag` workflow updates the major tag (e.g. `v3`).

### Minor and Patch Releases

1. Open a PR with changes.
2. Apply the label `release minor` or `release patch`.
3. The `package-version` workflow updates the version on the PR branch.
4. Merge, then wait for `update-dist` to update `dist/index.js`.
5. Create a GitHub Release from the updated `dist/index.js` commit.

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
- PRs may or may not update `dist/`, depending on the workflow policy.

## References

- `@actions/core`: https://www.npmjs.com/package/@actions/core
- `@octokit/rest`: https://www.npmjs.com/package/@octokit/rest
- GitHub REST API v3: https://developer.github.com/v3/
