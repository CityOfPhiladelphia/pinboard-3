import { createApp } from 'vue'
import { createPinboard } from '@pinboard/ui'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

const app = createApp(App)

app.use(router)
app.use(i18n)
app.use(
  createPinboard({
    appId: 'oem-flood',
    map: {
      center: [-75.12, 39.98],
      zoom: 11,
      mobile: {
        zoom: 9.5,
      },
    },
  }),
)

app.mount('#app')
