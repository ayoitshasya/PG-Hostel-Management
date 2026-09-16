// ESLint is a linter: it statically scans the code for likely bugs and
// style issues (e.g. calling a React hook conditionally, an unused
// variable) without actually running the app. `npm run lint` in
// frontend/package.json runs this config. This is the newer "flat config"
// format (a plain array of config objects) rather than ESLint's older
// .eslintrc format.
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Never lint the production build output.
  globalIgnores(['dist']),
  {
    // Applies these rules to every .js/.jsx file in the project.
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,               // ESLint's baseline JS rules
      reactHooks.configs['recommended-latest'], // catches invalid hook usage (e.g. hooks called inside `if`/loops)
      reactRefresh.configs.vite,            // flags patterns that break React Fast Refresh during dev
      jsxA11y.flatConfigs.recommended,      // accessibility rules for JSX (missing alt text, invalid ARIA, etc.)
    ],
    languageOptions: {
      ecmaVersion: 2020,
      // Makes browser globals like `window`, `document`, `localStorage`
      // known to ESLint so referencing them isn't flagged as undefined.
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Unused variables are usually a mistake, EXCEPT names starting with
      // an uppercase letter or underscore (e.g. unused component imports
      // kept for JSX, or intentionally-ignored destructured values) - those
      // are allowed without an error.
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
