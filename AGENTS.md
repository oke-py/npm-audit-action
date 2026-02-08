# Project Summary for Coding Agents

## Overview

This repository is a GitHub Action that runs `npm audit` and reports findings by commenting on PRs or creating issues. The action executes from `dist/index.js` and is built from TypeScript sources in `src/`.

## Key Files

- `action.yml`: Action inputs/outputs and runtime (`node24`)
- `src/main.ts`: Entry point
- `src/issue.ts`, `src/pr.ts`: Issue and PR comment logic
- `dist/index.js`: Bundled output used by GitHub Actions
- `__tests__/`: Vitest tests

## Local Commands

```bash
npm ci
npm run format:write
npm run lint
npm run test
npm run test:coverage
npm run package
```

## Guardrails

- Node.js 24+ is required (`package.json` engines).
- Keep `dist/` in sync with source changes; CI checks the bundle output.
- Follow Conventional Commits and keep PR text in English.
