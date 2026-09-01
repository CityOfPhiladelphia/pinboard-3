import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    // pnpm materializes vue-router twice (differing peer graphs); two copies mean
    // two injection symbols and useRoute() returns undefined inside @pinboard/ui.
    dedupe: ['vue', 'vue-router'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@pinboard/ui/style.css': fileURLToPath(
        new URL('../../../packages/ui/dist/ui.css', import.meta.url),
      ),
      '@pinboard/core': fileURLToPath(
        new URL('../../../packages/core/src/index.ts', import.meta.url),
      ),
      '@pinboard/ui': fileURLToPath(new URL('../../../packages/ui/src/index.ts', import.meta.url)),
    },
  },
})
