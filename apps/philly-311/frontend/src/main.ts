// ABOUTME: App entry point: install Pinia, sso-vue plugin, Router, then mount.
import '@phila/phila-ui-core/styles/template-light.css'
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createI18n } from 'vue-i18n'
import { createB2CPlugin } from '@phila/sso-vue'
import { createPinboard, pinboardMessages } from '@pinboard/ui'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(createPinia())
// ponytail: English-only for now; per-locale app messages when philly-311 localizes
app.use(
  createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: pinboardMessages }),
)
app.use(createB2CPlugin({ env: import.meta.env }))
app.use(router)
app.use(
  createPinboard({
    title: 'Philly 311',
    map: {
      center: [-75.1652, 39.9526],
      zoom: 11,
      minZoom: 10.5,
      mobile: { zoom: 9.5 },
    },
  }),
)
app.mount('#app')
