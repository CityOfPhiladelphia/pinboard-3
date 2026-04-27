import { createRouter, createWebHistory } from 'vue-router'
import ResourcesView from '../views/ResourcesView.vue'
import FinderView from '../views/FinderView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: FinderView,
    },
    {
      path: '/resources',
      component: ResourcesView,
    },
  ],
})

export default router
