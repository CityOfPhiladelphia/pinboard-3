// ABOUTME: Vitest config for @pinboard/ui — jsdom env + Vue SFC plugin.
// ABOUTME: CSS stub plugin prevents errors from side-effect CSS imports in deps.
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
  test: {
    environment: 'jsdom',
    css: false,
    server: {
      deps: {
        inline: [/@phila\//],
      },
    },
  },
})
