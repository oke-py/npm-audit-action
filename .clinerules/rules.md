# Cline Rules

This document outlines the development guidelines and best practices for our TypeScript/JavaScript projects.

## Project Configuration

### TypeScript/JavaScript Best Practices

- **TypeScript Configuration**
  - Use `strict: true` in tsconfig.json to enable all strict type checking options
  - Enable `esModuleInterop` for better interoperability between CommonJS and ES Modules
  - Set `target` to ES2020 for modern JavaScript features
  - Use `module: NodeNext` for the latest Node.js module resolution
  - Use `noImplicitAny: true` to ensure all types are explicitly defined
  - Configure `outDir: "./lib"` and `rootDir: "./src"` to control the output directory structure
  - Set `baseUrl: "./"` and configure `paths` for module resolution

- **Code Formatting**
  - Use Prettier for consistent code formatting with the following settings:
    - Maximum line width of 80 characters (`printWidth: 80`)
    - 2-space indentation (`tabWidth: 2`)
    - No semicolons (`semi: false`)
    - Single quotes (`singleQuote: true`)
    - No trailing commas (`trailingComma: "none"`)
    - Avoid parentheses around single arrow function parameters (`arrowParens: "avoid"`)
    - Use TypeScript parser (`parser: "typescript"`)
  - Configure ESLint with TypeScript parser for static code analysis
  - Enforce consistent naming conventions:
    - camelCase for variables and functions
    - PascalCase for classes, interfaces, and type aliases
    - UPPER_CASE allowed for constants
  - Run `npm run format` to automatically format all TypeScript files according to project standards
  - Ensure code formatting is checked in CI with `npm run format-check`

- **Package Management**
  - Use npm with package-lock.json for consistent dependency management
  - Regularly update dependencies and run security audits
  - Specify exact versions for critical dependencies
  - Use `npm ci` instead of `npm install` in CI/CD pipelines

- **Testing**
  - Write unit tests for all business logic
  - Aim for high test coverage (at least 80%)
  - Use Vitest as the testing framework
  - Implement integration tests for critical paths

- **Build Process**
  - Use TypeScript compiler (`tsc`) for building the project
  - Use `@vercel/ncc` for bundling the code into a single file
  - Run `npm run build` to compile TypeScript files
  - Run `npm run pack` to bundle the code with ncc
  - Run `npm run all` to build, format, lint, pack, and test the project
  - Note that dist/index.js updates are handled by GitHub Actions and should not be included in commits or pull requests

## Git Workflow

### Commit Messages

- Write all commit messages in English
- Follow the conventional commits format: `type(scope): message`
  - Example: `fix(auth): resolve token validation issue`
  - Common types: feat, fix, docs, style, refactor, test, chore
- Keep commit messages concise but descriptive
- Reference issue numbers when applicable: `fix(api): correct response format (#123)`

### Branches

- Use feature branches for all new development
- Name branches descriptively with prefixes:
  - `feature/` for new features
  - `fix/` for bug fixes
  - `docs/` for documentation changes
  - `refactor/` for code refactoring
- Keep branches up to date with the main branch

### Pull Requests

- **IMPORTANT**: Write PR titles and descriptions in English ONLY, NOT in Japanese
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
  - Enclose title and body in single quotes (`'`) to handle spaces and special characters
  - For multi-line body text, use actual line breaks instead of `\n` escape sequences
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
