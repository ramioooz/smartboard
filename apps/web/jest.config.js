// @ts-check
const base = require('../../packages/config/jest.base.js');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  rootDir: '.',
  testEnvironment: 'node',
};
