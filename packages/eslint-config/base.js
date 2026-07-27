import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import tseslint from 'typescript-eslint'
import eslintPluginVue from 'eslint-plugin-vue'
import eslintPluginVueScopedCSS from 'eslint-plugin-vue-scoped-css';
import globals from 'globals'
import turboPlugin from 'eslint-plugin-turbo'

export const viteJsConfig = defineConfig([
  globalIgnores(['node_modules/**', 'dist/**', 'cdk.out']),
  js.configs.recommended,
  ...tseslint.configs.strict,
  turboPlugin.configs['flat/recommended'],
  ...eslintPluginVue.configs['flat/recommended'],
  ...eslintPluginVueScopedCSS.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    files: ['**/*.{js,mjs,ts,vue}'],
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
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-undef': 'off',
      "vue-scoped-css/no-unused-selector": "error"
    },
  },
])
