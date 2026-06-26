import { createRouter, createWebHistory, type RouteRecordRaw, type Router } from 'vue-router'

/**
 * Standard router setup shared by all pinboard apps: web-history mode anchored
 * at the app's base path. Apps pass their own routes; vue-router stays a peer
 * dependency so the app and its components share one router instance.
 */
export function createPinboardRouter(routes: RouteRecordRaw[]): Router {
  return createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
  })
}
