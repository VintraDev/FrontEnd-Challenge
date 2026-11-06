import js from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/mockServiceWorker.js',
      'src/routeTree.gen.ts',
      'playwright-report/**',
      'test-results/**',
      'graphify-out/**',
      '.agents/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginQuery.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message: 'Proibido usar dangerouslySetInnerHTML sem sanitização explícita auditada.',
        },
      ],
    },
  },
  {
    files: [
      'src/routes/**/*.{ts,tsx}',
      'src/features/**/*.{ts,tsx}',
      'src/components/**/*.{ts,tsx}',
      'src/lib/**/*.{ts,tsx}',
      'src/contracts/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/mocks/*', '@/mocks/**', '**/mocks/*'],
              message:
                'Violação de fronteira arquitetural: camadas de UI/features/lib/contracts não podem importar mocks diretamente. Acesse dados exclusivamente via Axios (/api) e Socket.IO.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/routes/**/*.{ts,tsx}', 'src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  eslintConfigPrettier,
);
