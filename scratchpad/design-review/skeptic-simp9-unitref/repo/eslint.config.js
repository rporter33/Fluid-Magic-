import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Modules that must stay deterministic and host-free: they run headless and, from M4, on a
// server. tests/sim/purity.test.ts enforces the same rules with a source scan.
const PURE_DIRS = ['src/sim/**', 'src/mapgen/**', 'src/content/**'];

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}', 'src/render/**/*.{ts,tsx}', 'src/main.tsx'],
    ...reactHooks.configs.flat['recommended-latest'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: PURE_DIRS,
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'Date', message: 'Sim time is state.day; never read the wall clock.' },
        { name: 'performance', message: 'Pure code must not read host timers.' },
        { name: 'crypto', message: 'All randomness goes through state.rng.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'All randomness goes through state.rng.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: ['react', 'react-dom', 'pixi.js', 'zustand', 'idb-keyval'],
          patterns: [
            { group: ['**/render', '**/render/**'], message: 'Pure code cannot import render.' },
            { group: ['**/ui', '**/ui/**'], message: 'Pure code cannot import ui.' },
          ],
        },
      ],
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      ...tseslint.configs.disableTypeChecked.languageOptions,
      globals: globals.node,
    },
  },
  prettier,
);
