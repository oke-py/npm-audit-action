# Repository Guide

## Purpose

This repository provides a GitHub Action that runs `npm audit` and reports
vulnerabilities through pull request comments or GitHub issues.

The published action executes the committed `dist/index.js` bundle.

## Architecture

- `src/index.ts`: Bundle entry point; invokes the action.
- `src/main.ts`: Main orchestration and GitHub API integration.
- `src/audit.ts`: Runs and interprets `npm audit`.
- `src/inputs.ts`: Parses action inputs.
- `src/issue-flow.ts`, `src/pr-flow.ts`: Issue and pull request workflows.
- `src/issue.ts`, `src/pr.ts`: Issue and comment helpers.
- `src/report.ts`: Markdown report generation.
- `action.yml`: Public inputs, outputs, and Node.js runtime.
- `__tests__/`: Vitest unit tests.
- `__tests__/e2e/`: Tests the built bundle against a mock GitHub API.
- `dist/`: Committed generated bundle used by GitHub Actions.

See `DEVELOPMENT.md` when the task concerns testing, releases, CI, packaging,
or dependency policy.

## Working Policy

- For review, explanation, diagnosis, or planning requests, inspect the
  relevant files and report findings without modifying the repository.
- For change, fix, or build requests, make the requested in-scope changes and
  run relevant non-destructive validation without asking first.
- Ask before destructive actions, external writes, or material expansion of
  scope.
- Ask about an ambiguity only when different answers would materially change
  the implementation. Otherwise, make a reasonable assumption and report it.

## Project Constraints

- Use Node.js 24 or newer.
- Preserve strict TypeScript and NodeNext ESM conventions. Relative imports in
  TypeScript use `.js` specifiers.
- Use Biome for formatting and linting.
- For behavior changes and bug fixes, follow the t-wada-style TDD workflow
  defined in `DEVELOPMENT.md`.
- Treat `action.yml` as the public API. When inputs or outputs change, update
  the implementation, tests, and README together.
- Do not edit `dist/` manually. Regenerate it with `npm run package`.
- Regenerate and commit `dist/` whenever source, runtime dependencies, or
  packaging changes can affect the published action.
- Keep GitHub Actions dependencies pinned to full commit SHAs.
- Do not update versions or `CHANGELOG.md` unless the task is explicitly about
  a release.
- Use Conventional Commits. Keep commit messages and pull request text in
  English.
- Preserve unrelated user changes in the working tree.

## Validation

Run the smallest validation set that covers the change:

- Documentation or metadata only: `npm run format:check`.
- TypeScript behavior: `npm run format:check`, `npm run lint`,
  `npm run typecheck`, and `npm run test`.
- Changes affecting the published bundle: run the TypeScript checks, then
  `npm run package` and `npm run test:e2e`.
- Broad or high-risk changes: `npm run all`.

Run `npm ci` first when dependencies are not already installed or when
`package-lock.json` changes.

End-to-end tests use the freshly generated `dist/index.js`; run
`npm run package` immediately before `npm run test:e2e`.

## Completion Criteria

Before reporting completion:

- Confirm that the requested behavior and relevant edge cases are covered.
- Confirm that generated `dist/` files are current when applicable.
- Check that the final diff contains no unrelated changes.
- Report the validation commands run and their results.
- If a relevant check could not be run, state exactly which check was skipped
  and why.
