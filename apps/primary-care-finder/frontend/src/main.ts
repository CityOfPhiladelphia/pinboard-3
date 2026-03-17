import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPinboard } from '@pinboard/ui'
import App from './App.vue'
import i18n from './i18n'
import { useLocations } from './composables/useLocations'

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(createPinboard({
  title: 'Primary Care Finder',
  useLocations: () => useLocations(),
  map: {
    center: [-75.16, 39.95],
    zoom: 12,
  },
}))

app.mount('#app')
