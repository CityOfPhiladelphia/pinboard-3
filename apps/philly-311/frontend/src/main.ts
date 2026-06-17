// ABOUTME: App entry point: install Pinia, sso-vue plugin, Router, then mount.
import '@phila/phila-ui-core/styles/template-light.css'
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css'
import '@/assets/theme.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createB2CPlugin } from '@phila/sso-vue'
import { createPinboard } from '@pinboard/ui'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(createB2CPlugin())
app.use(router)
app.use(
  createPinboard({
    title: 'Philly 311',
    map: {
      center: [-75.1652, 39.9526],
      zoom: 11,
      mobile: { zoom: 9.5 },
    },
  }),
)
app.mount('#app')
