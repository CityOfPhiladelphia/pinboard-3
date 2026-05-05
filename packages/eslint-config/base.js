import js from '@eslint/js'
import { globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import tseslint from 'typescript-eslint'
import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import turboPlugin from 'eslint-plugin-turbo'

export const viteJsConfig = [
  globalIgnores(['node_modules/**', 'dist/**', 'cdk.out']),
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2024,
      },
      parserOptions: {
        parser: tseslint.parser,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      'no-undef': 'off',
    },
  },
  turboPlugin.configs['flat/recommended'],
  ...eslintPluginVue.configs['flat/recommended'],
  eslintConfigPrettier,
]
