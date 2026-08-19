// ABOUTME: Global vitest setup for @pinboard/ui — polyfills window.matchMedia
// ABOUTME: (missing in jsdom) and registers real vue-router/vue-i18n globally
// ABOUTME: so component mounts don't each need to wire their own plugins.
import { beforeEach, vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import { pinboardMessages } from '../i18n'
import { createPinboard } from '../plugin'

window.matchMedia =
  window.matchMedia ??
  vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: pinboardMessages,
})

// Components inject PINBOARD_CONFIG_KEY, which apps supply by installing this
// plugin. Install it here too so mounts see the same config channel they do in
// an app rather than injecting undefined and quietly dropping config-gated UI.
const pinboard = createPinboard({ appId: 'test', mobileFilterPlacement: 'sheet' })

// Fresh router per test: components that watch the route (PinboardBody,
// PinboardShell) keep their watcher alive if a test never unmounts its
// wrapper, and a router instance shared across tests lets one test's
// navigation reactively re-trigger a previous test's orphaned watcher —
// crashing on a component instance already torn down mid-test. A new
// router each test means those orphans watch a router nobody pushes to.
beforeEach(() => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  config.global.plugins = [router, i18n, pinboard]
})
