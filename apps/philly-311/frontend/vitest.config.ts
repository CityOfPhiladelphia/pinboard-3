// ABOUTME: Vitest config for the philly-311 frontend.
// ABOUTME: jsdom env, Vue plugin, and the '@' alias.
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    conditions: ['import', 'module', 'browser', 'default'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    // @phila/phila-ui-core's main entry has a side-effect `import './index.css'`.
    // Left externalized, Vitest loads it via Node's own resolver, which can't
    // handle a bare .css import; inlining routes it through Vite's transform
    // instead, which strips/no-ops CSS imports like it does for the real app build.
    server: {
      deps: {
        inline: ['@phila/phila-ui-core'],
      },
    },
  },
})
