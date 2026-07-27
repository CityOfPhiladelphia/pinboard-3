import { viteJsConfig } from '@repo/eslint-config/base.js'

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...viteJsConfig,
  {
    // Test files define inline stub components; component-authoring rules don't apply.
    files: ['**/__tests__/**'],
    rules: {
      'vue/one-component-per-file': 'off',
      'vue/require-prop-types': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },
]
