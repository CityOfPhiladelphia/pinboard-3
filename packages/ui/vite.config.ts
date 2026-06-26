import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src'],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'PinboardUI',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: (id) => {
        // Allow map-core CSS to be bundled into our output
        if (id.includes('@phila/phila-ui-map-core') && id.endsWith('.css')) return false
        if (id.includes('@phila/phila-ui-bottom-sheet') && id.endsWith('.css')) return false
        return [
          'vue',
          'vue-router',
          'vue-i18n',
          '@pinboard/core',
          '@phila/phila-ui-map-core',
          '@phila/phila-ui-bottom-sheet',
        ].some((dep) => id === dep || id.startsWith(dep + '/'))
      },
      output: {
        globals: {
          vue: 'Vue',
          '@pinboard/core': 'PinboardCore',
        },
      },
    },
  },
})
