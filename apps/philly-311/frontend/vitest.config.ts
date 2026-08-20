// ABOUTME: Vitest config for the philly-311 frontend.
// ABOUTME: jsdom env, Vue plugin, and the '@' alias.
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Mirrors vite.config.ts: reportSubmission.ts imports @pinboard/core directly,
      // and Vitest doesn't share the app's build config.
      '@pinboard/core': fileURLToPath(
        new URL('../../../packages/core/src/index.ts', import.meta.url),
      ),
    },
    conditions: ['import', 'module', 'browser', 'default'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    // @phila/phila-ui-core's and @phila/phila-ui-breadcrumbs' main entries have a
    // side-effect `import './index.css'`. Left externalized, Vitest loads them via
    // Node's own resolver, which can't handle a bare .css import; inlining routes
    // it through Vite's transform instead, which strips/no-ops CSS imports like it
    // does for the real app build.
    server: {
      deps: {
        inline: ['@phila/phila-ui-core', '@phila/phila-ui-breadcrumbs'],
      },
    },
  },
})
