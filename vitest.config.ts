import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    // the end-to-end tests need a built bundle; see vitest.e2e.config.ts
    exclude: ['__tests__/e2e/**'],
    coverage: {
      include: ['src/**/*.ts'], // Only target the src directory
      exclude: ['lib/**', '__fixtures__/**', '__tests__/**'], // Exclude the lib directory
      reporter: ['text', 'json', 'html', 'lcov']
    }
  }
})
