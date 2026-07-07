/*
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**\/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module'
      }
    },
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      'no-console': 'warn',
      eqeqeq: ['error', 'always']
    }
  }
];
*/

import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';

export default [
  {
    files: ['**/*.ts'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json'
      }
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      unicorn: unicorn
    },

    settings: {
      'import/resolver': {
        typescript: true
      }
    },

    rules: {
      // =========================
      // 1. NAMING CONVENTION
      // =========================
      '@typescript-eslint/naming-convention': [
        'error',

        // Classes / Interfaces / Types
        {
          selector: 'typeLike',
          format: ['PascalCase']
        },

        // Disallow I prefix
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false
          }
        },

        // Variables & functions
        {
          selector: 'variableLike',
          format: ['camelCase']
        },

        // Constants (allow UPPER_CASE)
        {
          selector: 'variable',
          modifiers: ['const'],
          format: ['camelCase', 'UPPER_CASE']
        }
      ],

      // =========================
      // 2. FILE NAMING
      // =========================
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase'
        }
      ],

      // =========================
      // 3. IMPORT ORDER
      // =========================
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index'
          ],
          'newlines-between': 'always'
        }
      ],

      // =========================
      // 4. NO UNUSED
      // =========================
      '@typescript-eslint/no-unused-vars': ['error'],

      // =========================
      // 5. NO RELATIVE UPWARD IMPORT HELL
      // =========================
      'no-restricted-imports': [
        'error',
        {
          patterns: ['../../*', '../../../*']
        }
      ],

      // =========================
      // 6. ARCHITECTURE ENFORCEMENT
      // =========================
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // ❌ core must not depend on components/systems
            {
              target: './src/core',
              from: './src/components'
            },
            {
              target: './src/core',
              from: './src/systems'
            },

            // ❌ utils must not depend on core
            {
              target: './src/utils',
              from: './src/core'
            },

            // ❌ models must not depend on anything
            {
              target: './src/models',
              from: './src'
            },

            // ❌ errors must not depend on other layers
            {
              target: './src/errors',
              from: './src/core'
            },
            {
              target: './src/errors',
              from: './src/components'
            },
            {
              target: './src/errors',
              from: './src/systems'
            }
          ]
        }
      ],

      // =========================
      // 7. IMPORT EXTENSIONS (ESM SAFE)
      // =========================
      'import/extensions': [
        'error',
        'always',
        {
          ts: 'never'
        }
      ]
    }
  }
];
