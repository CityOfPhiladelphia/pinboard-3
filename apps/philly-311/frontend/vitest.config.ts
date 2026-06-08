// ABOUTME: Vitest config for the philly-311 frontend.
// ABOUTME: jsdom env, Vue plugin, '@' alias, and a CSS-stub plugin so tests can
// ABOUTME: mount components whose dist files import side-effect CSS.
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const cssStub: Plugin = {
  name: 'vitest-css-stub',
  enforce: 'pre',
  resolveId(id) {
    if (id.endsWith('.css')) return '\0vitest-css-stub'
    return undefined
  },
  load(id) {
    if (id === '\0vitest-css-stub') return 'export default {};'
    return undefined
  },
}

export default defineConfig({
  plugins: [cssStub, vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    conditions: ['import', 'module', 'browser', 'default'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__test__/setup.ts'],
    css: false,
  },
})
