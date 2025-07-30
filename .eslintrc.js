// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
  rules: {
    // Prevent JSON imports that can crash in production builds
    'import/no-json': 'error',
    // Catch unresolved imports early
    'import/no-unresolved': ['error', { 
      ignore: ['^@/', '^@/.*'] // Allow our path aliases
    }],
    // Warn about unused imports that add to bundle size
    'unused-imports/no-unused-imports': 'warn',
  },
  settings: {
    'import/resolver': {
      'babel-module': {
        alias: {
          '@': './.',
        }
      }
    }
  }
};
