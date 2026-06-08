// ABOUTME: Vue Router setup for philly-311.
// ABOUTME: Increment 1 routes only; auth + wizard guards are added in Task 6.
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('@/pages/LandingPage.vue') },
]

const router = createRouter({ history: createWebHistory(), routes })

export default router
