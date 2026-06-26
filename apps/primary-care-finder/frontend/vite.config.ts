import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  build: {
    minify: 'esbuild',
  },
  resolve: {
    // @pinboard/ui externalizes these peers, so its source and the app must
    // resolve to a single copy of each — otherwise vue-router/vue-i18n inject()
    // keys differ between the package and the app and useRouter()/useI18n()
    // return undefined in the production bundle.
    dedupe: ['vue', 'vue-router', 'vue-i18n'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@pinboard/ui/style.css': fileURLToPath(
        new URL('../../../packages/ui/dist/ui.css', import.meta.url)
      ),
      '@pinboard/ui': fileURLToPath(new URL('../../../packages/ui/src/index.ts', import.meta.url)),
    },
  },
})
