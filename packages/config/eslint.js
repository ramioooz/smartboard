// @ts-check
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

/** @type {import('eslint').Linter.Config[]} */
const base = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // NestJS uses emitDecoratorMetadata to inject class references at runtime via
    // Reflect.metadata. `import type` strips the import from the JS output, making
    // the DI token invisible to NestJS — the container sees `?` instead of the class.
    // Disable consistent-type-imports for NestJS class files so `import { SomeService }`
    // is never auto-converted to `import type { SomeService }`.
    files: [
      '**/*.service.ts',
      '**/*.controller.ts',
      '**/*.guard.ts',
      '**/*.interceptor.ts',
      '**/*.filter.ts',
      '**/*.middleware.ts',
      '**/*.processor.ts',
      '**/*.client.ts',
    ],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.next/**', '**/coverage/**'],
  },
];

module.exports = base;
