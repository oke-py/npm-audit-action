## Resources

### @actions/core

- https://www.npmjs.com/package/@actions/core
- https://github.com/actions/toolkit

### @octokit/rest

- https://www.npmjs.com/package/@octokit/rest
- https://github.com/octokit/rest.js
- https://octokit.github.io/rest.js/

### GitHub REST API v3

- https://developer.github.com/v3/

## Development Instructions

### Running Tests

This project uses [Vitest](https://vitest.dev/) for testing. To run the tests, use the following command:

```bash
npm run test
```

Vitest will execute all test files and provide a detailed report of the results.

### Generating Coverage Reports

To generate a test coverage report, use the following command:

```bash
npm run test:coverage
```

The coverage report will be available in the `coverage` directory.

## Release Process

This project follows semantic versioning (SemVer) for releases. The release process is partially automated through GitHub Actions workflows.

### Major Version Release Procedure

For major version releases (e.g., v2.x.x to v3.0.0), follow these steps:

1. **Create a Feature Branch**

   ```bash
   git switch -c feature/update-to-vX
   ```

   Replace `X` with the new major version number.

2. **Update Version in Package Files**

   Manually update the version in `package.json` and `package-lock.json`:

   ```bash
   # Edit package.json to change version from "X-1.y.z" to "X.0.0"
   # Then update package-lock.json
   npm install
   ```

3. **Update References in Documentation and Workflows**

   Update all references to the previous major version in:
   - README.md (usage examples)
   - Workflow files in `.github/workflows/` directory
   - Any other documentation or code referencing the version

4. **Create a Pull Request**

   ```bash
   git add .
   git commit -m "feat: update references from vX-1 to vX for release vX.0.0"
   git push origin feature/update-to-vX
   ```

   Create a pull request on GitHub with a clear description of the major version changes.

5. **Review and Merge**

   After code review and all checks pass, merge the pull request into the main branch.

6. **Wait for dist/index.js Update**

   After merging to the main branch, the `update dist/index.js` workflow will automatically run to compile the TypeScript code and update the dist/index.js file. This will create a new commit with the message "chore(build): automated change".

   **Important**: You must wait for this automated commit to complete before proceeding to the next step, as the release should be created from this commit to ensure it includes the updated dist/index.js.

7. **Create a GitHub Release**

   - Go to the Releases page on GitHub
   - Click "Draft a new release"
   - Set the tag to `vX.0.0` (e.g., `v3.0.0`)
   - **Important**: Ensure you're creating the release from the latest commit that includes the updated dist/index.js
   - Set the title to a descriptive name for the release
   - Add detailed release notes describing breaking changes, new features, etc.
   - Publish the release

8. **Automatic Major Version Tag**

   After publishing the release, the `git-tag-major-version` workflow will automatically:
   - Extract the major version from the release tag (e.g., `v3.0.0` → `v3`)
   - Delete the existing major version tag if it exists
   - Create a new major version tag pointing to the release commit
   - Push the major version tag to the repository

### Minor and Patch Releases

For minor and patch releases, the process is more automated:

1. Create a pull request with your changes
2. Add the appropriate label to the pull request:
   - `release minor` for minor version updates (new features)
   - `release patch` for patch version updates (bug fixes)
3. The `update package version` workflow will automatically:
   - Increment the version in package.json
   - Create a version commit
   - Push the changes to your branch
4. After merging, wait for the `update dist/index.js` workflow to complete
5. Create a GitHub release with the new version number from the latest commit that includes the updated dist/index.js

### Automatic Processes

The following processes happen automatically:

- **dist/index.js Updates**: When changes are pushed to the main branch, the `update dist/index.js` workflow automatically compiles the TypeScript code and updates the dist/index.js file.
- **Testing**: Pull requests and changes to the main branch trigger the `build-test` workflow to ensure the code builds and passes all tests.
- **Daily Scanning**: The `daily scan` workflow runs npm audit daily to check for vulnerabilities.
