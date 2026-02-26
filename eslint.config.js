// Root ESLint flat config — ESLint v9+
// All workspace packages resolve to this file via directory traversal.
const base = require('./packages/config/eslint.js');

module.exports = base;
