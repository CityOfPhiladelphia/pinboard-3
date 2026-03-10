// packages/ui/src/plugin.ts
import type { Plugin } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { PinboardConfig } from './types'
import { PINBOARD_CONFIG_KEY } from './types'
import HomeView from './views/HomeView.vue'
import FinderView from './views/FinderView.vue'

export function createPinboard(config: PinboardConfig): Plugin {
  return {
    install(app) {
      const router = createRouter({
        history: createWebHistory(import.meta.env.BASE_URL),
        routes: [
          { path: '/', component: HomeView },
          { path: '/finder', component: FinderView },
        ],
      })

      app.use(router)
      app.provide(PINBOARD_CONFIG_KEY, config)
    },
  }
}
