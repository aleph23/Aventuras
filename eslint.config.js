// Flat config. See:
//   https://docs.expo.dev/guides/using-eslint/
//   https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
//   https://github.com/prettier/eslint-config-prettier
//
// Project rule policy is documented in .claude/rules/code.md. The
// wildcard-import ban is mechanically enforced here AND explained
// there; the rn-primitives exception list must stay in sync between
// the two files.
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const storybook = require('eslint-plugin-storybook')
const prettierConfig = require('eslint-config-prettier/flat')
const reactNative = require('eslint-plugin-react-native')
const unusedImports = require('eslint-plugin-unused-imports')
const tseslint = require('@typescript-eslint/eslint-plugin')

module.exports = defineConfig([
  expoConfig,
  ...storybook.configs['flat/recommended'],
  prettierConfig,

  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-native': reactNative,
      'unused-imports': unusedImports,
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Wildcard import ban. Exception list lives in
      // .claude/rules/code.md — keep in sync.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'ImportDeclaration[source.value!=/^@rn-primitives\\//] ImportNamespaceSpecifier',
          message:
            'Wildcard imports are banned. Use named imports. Exception: @rn-primitives/*. See .claude/rules/code.md.',
        },
      ],

      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // unused-imports replaces @typescript-eslint/no-unused-vars so
      // dead imports get auto-removed (the TS rule warns but won't fix
      // imports).
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'none',
          ignoreRestSiblings: true,
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      'react-hooks/exhaustive-deps': 'error',

      'no-console': ['error', { allow: ['warn', 'error'] }],

      'react-native/no-inline-styles': 'error',
      'react-native/no-color-literals': 'error',
    },
  },

  // Story files, dev routes, and Storybook-docs surfaces routinely
  // need ad-hoc inline styling for demos.
  {
    files: ['**/*.stories.tsx', 'app/dev/**', 'components/foundations/**'],
    rules: {
      'react-native/no-inline-styles': 'off',
      'react-native/no-color-literals': 'off',
    },
  },

  // Console is fine in build scripts, dev routes, the Electron main
  // process (no other diagnostic surface), and story action handlers.
  {
    files: ['scripts/**', 'app/dev/**', 'electron/**', '**/*.stories.tsx'],
    rules: {
      'no-console': 'off',
    },
  },

  {
    ignores: [
      'dist/**',
      'release/**',
      'storybook-static/**',
      'electron/dist/**',
      '.expo/**',
      'node_modules/**',
      '_tmp/**',
    ],
  },
])
