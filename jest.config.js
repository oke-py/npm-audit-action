module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  moduleNameMapper: {
    '^axios$': require.resolve('axios'),
  },
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true
}
