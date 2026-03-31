import { createRouter, createWebHistory } from 'vue-router'
import GlossaryView from '../views/GlossaryView.vue'
import FinderView from '../views/FinderView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: FinderView,
    },
    {
      path: '/glossary',
      component: GlossaryView,
    },
  ],
})

export default router