// ABOUTME: Vitest config for @pinboard/ui — jsdom env + Vue SFC plugin.
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        inline: [/@phila\//],
      },
    },
  },
})
