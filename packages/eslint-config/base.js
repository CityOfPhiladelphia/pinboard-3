import js from "@eslint/js";
import { globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";
import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import turboPlugin from "eslint-plugin-turbo";

export const viteJsConfig = [
  globalIgnores([
    'node_modules/**',
    'dist/**',
    "cdk.out"
  ]),
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022
      },
      parserOptions: {
        parser: tseslint.parser,
        tsconfigRootDir: import.meta.dirname
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
    },
  },
  turboPlugin.configs["flat/recommended"],
  ...eslintPluginVue.configs['flat/recommended'],
  eslintConfigPrettier
];
