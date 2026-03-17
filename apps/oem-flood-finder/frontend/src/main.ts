import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createPinboard } from '@pinboard/ui'
import App from './App.vue'
import { useLocations } from './composables/useLocations'

const app = createApp(App)

app.use(createPinia())
app.use(createPinboard({
  title: '',
  useLocations: () => useLocations(),
  map: {
    center: [-75.16, 39.95],
    zoom: 11,
  },
}))

app.mount('#app')
