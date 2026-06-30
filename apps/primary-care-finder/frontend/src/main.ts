import { createApp } from 'vue'
import { createPinboard, createPinboardRouter } from '@pinboard/ui'
import App from './App.vue'
import FinderView from './views/FinderView.vue'
import InfoView from './views/InfoView.vue'
import i18n from './i18n'

const app = createApp(App)

app.use(i18n)
app.use(
  createPinboard({
    mobileFilterPlacement: 'map',
    map: {
      center: [-75.16, 39.95],
      zoom: 12,
    },
  })
)
app.use(
  createPinboardRouter([
    { path: '/', component: FinderView },
    { path: '/info', component: InfoView },
  ])
)

app.mount('#app')
