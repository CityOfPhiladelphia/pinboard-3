// ABOUTME: Vue Router setup for philly-311.
// ABOUTME: Increment-1 route table; auth guard (sso-vue) + wizard guard (store).
import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
  type NavigationGuard,
  type RouteLocationNormalized,
} from 'vue-router'
import { watch } from 'vue'
import { useAuth } from '@phila/sso-vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

export const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('@/pages/LandingPage.vue') },
  {
    path: '/report',
    component: () => import('@/pages/ReportPage.vue'),
    children: [
      { path: '', component: () => import('@/pages/report/ImageStep.vue') },
      { path: 'issue-type', component: () => import('@/pages/report/IssueTypeStep.vue') },
      { path: 'location', component: () => import('@/pages/report/LocationStep.vue') },
      { path: 'details', component: () => import('@/pages/report/DetailsStep.vue') },
      { path: 'review', component: () => import('@/pages/report/ReviewStep.vue') },
    ],
  },
  { path: '/answers/:id', component: () => import('@/pages/AnswerDetailPage.vue') },
  { path: '/auth/redirect', component: () => import('@/pages/AuthRedirectPage.vue') },
]

// Exported so tests can attach it to a memory router without reimplementing the logic.
export const authGuard: NavigationGuard = async (to) => {
  if (!to.meta.requiresAuth) return true
  const auth = useAuth()
  if (!auth.authReady.value) {
    await new Promise<void>((resolve) => {
      const stop = watch(
        auth.authReady,
        (ready) => {
          if (ready) {
            stop()
            resolve()
          }
        },
        { immediate: true },
      )
    })
  }
  if (auth.isAuthenticated.value) return true
  sessionStorage.setItem('auth:redirectTo', to.fullPath)
  auth.signIn()
  return false
}

// Exported so tests can attach it to a memory router without going through the singleton.
export function wizardGuard(to: RouteLocationNormalized): true | string {
  if (to.path === '/report' || !to.path.startsWith('/report/')) return true
  const store = useReportSubmissionStore()

  // Apply deep-link query params before checking emptiness. A category
  // in the URL always wins over whatever's in the store — this is the
  // path HeaderSearch takes when the user picks a different service
  // type mid-flow. setCategory clears customFields when the category
  // actually changes, so old answers don't leak into the new questions.
  if (typeof to.query.category === 'string' && to.query.category !== store.category) {
    store.setCategory(to.query.category)
  }
  const lat = Number(to.query.lat)
  const lng = Number(to.query.lng)
  if (
    typeof to.query.lat === 'string' &&
    typeof to.query.lng === 'string' &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    !store.location
  ) {
    store.setLocation({ address: '', lat, lng })
  }

  // Issue type is always reachable (it's where a category is chosen); Image is optional.
  if (to.path === '/report/issue-type') return true
  // Deeper steps require a chosen category.
  if (!store.category) return '/report'
  return true
}

const router = createRouter({ history: createWebHistory(), routes })
router.beforeEach(authGuard)
router.beforeEach(wizardGuard)

export default router
