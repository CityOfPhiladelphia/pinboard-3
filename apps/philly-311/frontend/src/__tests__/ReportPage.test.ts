// ABOUTME: Tests for ReportPage wizard shell scroll handling — the wizard is its
// ABOUTME: own scroll container, so each step change must start back at the top.
import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'
import ReportPage from '../pages/ReportPage.vue'

const Step = { template: '<div />' }

async function mountWizard() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/report',
        component: ReportPage,
        children: [
          { path: '', component: Step },
          { path: 'issue-type', component: Step },
        ],
      },
      { path: '/:pathMatch(.*)*', component: Step },
    ],
  })
  await router.push('/report')
  const wrapper = mount(ReportPage, {
    global: { plugins: [router, createPinia()] },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('ReportPage', () => {
  it('resets the wizard scroll position when the step changes', async () => {
    const { wrapper, router } = await mountWizard()
    const wizard = wrapper.find('.wizard')
    wizard.element.scrollTop = 150
    await router.push('/report/issue-type')
    await flushPromises()
    expect(wizard.element.scrollTop).toBe(0)
  })
})
