// @ts-check
/** @type {import('jest').Config} */
const base = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  passWithNoTests: true,
  // Strip .js extensions from TypeScript ESM-style imports so ts-jest can resolve them
  moduleNameMapper: {
    '^(\\.\\.?/.*)\\.js$': '$1',
  },
};

module.exports = base;
