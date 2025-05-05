# Cline Rules

This document outlines the development guidelines and best practices for our
TypeScript/JavaScript projects.

## Project Configuration

### TypeScript/JavaScript Best Practices

- **TypeScript Configuration**

  - Use `strict: true` in tsconfig.json to enable all strict type checking
    options
  - Enable `esModuleInterop` for better interoperability between CommonJS and ES
    Modules
  - Set `target` to ES2022 for modern JavaScript features
  - Use `module: NodeNext` and `moduleResolution: NodeNext` for the latest
    Node.js module resolution
  - Use `noImplicitAny: true` to ensure all types are explicitly defined
  - Configure `outDir: "./dist"` and `rootDir: "./src"` to control the output
    directory structure
  - Use `type: "module"` in package.json for ES modules support
  - Require Node.js version 20 or higher (`"node": ">=20.0.0"` in engines)
  - Enable `resolveJsonModule: true` for importing JSON files
  - Set `forceConsistentCasingInFileNames: true` to prevent issues on
    case-sensitive file systems

- **Code Formatting**

  - Use Prettier for consistent code formatting with the following settings:
    - Maximum line width of 80 characters (`printWidth: 80`)
    - 2-space indentation (`tabWidth: 2`)
    - No semicolons (`semi: false`)
    - Single quotes (`singleQuote: true`)
    - Quote properties as-needed (`quoteProps: "as-needed"`)
    - No single quotes in JSX (`jsxSingleQuote: false`)
    - No trailing commas (`trailingComma: "none"`)
    - Include spaces in object literals (`bracketSpacing: true`)
    - Place closing brackets on the same line (`bracketSameLine: true`)
    - Always include parentheses around arrow function parameters
      (`arrowParens: "always"`)
    - Always wrap prose (`proseWrap: "always"`)
    - CSS-based HTML whitespace sensitivity (`htmlWhitespaceSensitivity: "css"`)
    - Use LF line endings (`endOfLine: "lf"`)
  - Configure ESLint with the new flat config format (eslint.config.mjs) for
    static code analysis
  - Use TypeScript ESLint for TypeScript-specific linting rules
  - Enforce consistent naming conventions:
    - camelCase for variables and functions
    - PascalCase for classes, interfaces, and type aliases
    - UPPER_CASE allowed for constants
  - Run `npm run format:write` to automatically format all files according to
    project standards
  - Ensure code formatting is checked in CI with `npm run format:check`

- **Package Management**

  - Use npm with package-lock.json for consistent dependency management
  - Regularly update dependencies and run security audits
  - Specify exact versions for critical dependencies
  - Use `npm ci` instead of `npm install` in CI/CD pipelines
  - Set minimum Node.js version requirement in package.json engines field

- **Testing**

  - Write unit tests for all business logic
  - Aim for high test coverage (at least 80%)
  - Use Vitest as the testing framework
  - Run tests with `npm test` or `npm run test:coverage` for coverage reports
  - Implement integration tests for critical paths

- **Build Process**
  - Use TypeScript for type checking and transpilation
  - Use Rollup for bundling the code with TypeScript plugin
  - Run `npm run package` to bundle the code with Rollup
    (`npx rollup --config rollup.config.ts --configPlugin @rollup/plugin-typescript`)
  - Run `npm run all` to format, lint, test, and package the project
    (`npm run format:write && npm run lint && npm run test:coverage && npm run package`)
  - Output ES modules to dist/index.js with source maps
  - Note that dist/index.js updates are handled by GitHub Actions and should not
    be included in commits or pull requests

## Git Workflow

### Commit Messages

- Write all commit messages in English
- Follow the conventional commits format: `type(scope): message`
  - Example: `fix(auth): resolve token validation issue`
  - Common types: feat, fix, docs, style, refactor, test, chore
- Keep commit messages concise but descriptive
- Reference issue numbers when applicable:
  `fix(api): correct response format (#123)`

### Branches

- Use feature branches for all new development
- Name branches descriptively with prefixes:
  - `feature/` for new features
  - `fix/` for bug fixes
  - `docs/` for documentation changes
  - `refactor/` for code refactoring
- Keep branches up to date with the main branch

### Pull Requests

- **IMPORTANT**: Write PR titles and descriptions in English ONLY, NOT in
  Japanese
- Use clear, descriptive titles that summarize the changes
- Include detailed descriptions explaining:
  - What changes were made
  - Why the changes were necessary
  - Any potential side effects or areas to test
- Reference related issues using GitHub keywords (Fixes #123, Closes #456)
- Use the GitHub CLI (`gh` command) to create pull requests:

  ```bash
  gh pr create --title 'Your PR title' --body 'Detailed description' --base main
  ```

  - Enclose title and body in single quotes (`'`) to handle spaces and special
    characters
  - For multi-line body text, use actual line breaks instead of `\n` escape
    sequences
  - Format the body text with Markdown for better readability:

    ```bash
    gh pr create --title 'fix: resolve issue with authentication' --body 'Fixed the authentication issue by updating the token validation logic.

    ## Changes

    1. Updated the token validation in `auth.ts`
    2. Added unit tests for the new validation logic
    3. Updated documentation

    Fixes #123'
    ```

## Code Review

- All code must be reviewed before merging
- Address all review comments before requesting re-review
- Reviewers should focus on:
  - Code correctness
  - Test coverage
  - Performance implications
  - Security considerations
  - Adherence to project standards

## Continuous Integration

- All PRs must pass CI checks before merging
- CI pipeline should include:
  - Linting
  - Type checking
  - Unit and integration tests
  - Build verification
  - Security scanning

## Documentation

- Document all public APIs and interfaces
- Keep README.md up to date with setup and usage instructions
- Document complex algorithms or business logic with comments
- Use JSDoc comments for functions and classes
