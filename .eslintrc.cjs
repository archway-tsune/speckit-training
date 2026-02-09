/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'next/core-web-vitals',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'react'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React 17+ では不要
    'react/react-in-jsx-scope': 'off',
    // 未使用変数は警告（_ プレフィックスは除外）
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    // any は警告
    '@typescript-eslint/no-explicit-any': 'warn',
    // 空のinterface は許可
    '@typescript-eslint/no-empty-interface': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'dist/',
    '*.config.js',
    '*.config.cjs',
    '*.config.mjs',
  ],
};
