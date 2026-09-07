import { defineConfig } from 'vitest/config'

// End-to-end tests run the built `dist/index.js`, so they live in their own
// project and are not part of `npm run test`. Run `npm run package` first.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/e2e/**/*.test.ts'],
    testTimeout: 60000,
    // each test spawns a child process and binds a port
    fileParallelism: false
  }
})
