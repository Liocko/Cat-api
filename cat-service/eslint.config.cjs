module.exports = {
  ignores: ['node_modules/**', 'analysis/**'],
  languageOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  plugins: {},
  rules: {
    'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
    'no-console': 'off'
  },
  settings: {}
};
