import { createApp } from 'vue'
import { createPinboard } from '@pinboard/ui'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)
app.use(createPinboard({
  title: '',
  map: {
    center: [-75.12, 39.98],
    zoom: 11,
  },
}))

app.mount('#app')
