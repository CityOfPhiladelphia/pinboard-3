// ABOUTME: Tests for ReportPage wizard shell — stepper rendering, contextual
// ABOUTME: nav controls (Skip/Back), and Next advancing to the next step.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent, inject, type Ref } from 'vue'
import ReportPage from './ReportPage.vue'
import { WIZARD_CAN_ADVANCE_KEY } from '@/composables/useWizardValidity'

const Stub = (text: string) =>
  defineComponent({ setup: () => () => text, template: `<div>${text}</div>` })

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/report',
        component: ReportPage,
        children: [
          { path: '', component: Stub('image-step') },
          { path: 'issue-type', component: Stub('issue-step') },
          { path: 'location', component: Stub('location-step') },
          { path: 'details', component: Stub('details-step') },
          { path: 'review', component: Stub('review-step') },
        ],
      },
    ],
  })
}

describe('ReportPage shell', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders the stepper and the active step via router-view', async () => {
    const router = makeRouter()
    router.push('/report')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()
    expect(w.text()).toContain('Image')
    expect(w.text()).toContain('Review')
    expect(w.text()).toContain('image-step')
  })

  it('shows Skip on the Image step and Back on later steps', async () => {
    const router = makeRouter()
    router.push('/report')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()
    expect(w.find('[data-test="wizard-skip"]').exists()).toBe(true)
    router.push('/report/issue-type')
    await flushPromises()
    expect(w.find('[data-test="wizard-back"]').exists()).toBe(true)
  })

  it('Next advances to the next step', async () => {
    const router = makeRouter()
    router.push('/report')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()
    await w.find('[data-test="wizard-next"]').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('issue-step')
  })

  it('disables Next when the active step sets canAdvance to false', async () => {
    const BlockingStep = defineComponent({
      setup() {
        const canAdvance = inject<Ref<boolean>>(WIZARD_CAN_ADVANCE_KEY)
        if (canAdvance) canAdvance.value = false
        return {}
      },
      template: '<div>blocking-step</div>',
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/report',
          component: ReportPage,
          children: [
            { path: '', component: BlockingStep },
            { path: 'issue-type', component: Stub('issue-step') },
          ],
        },
      ],
    })

    router.push('/report')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()

    expect(w.find('[data-test="wizard-next"]').attributes('disabled')).toBeDefined()
  })
})
