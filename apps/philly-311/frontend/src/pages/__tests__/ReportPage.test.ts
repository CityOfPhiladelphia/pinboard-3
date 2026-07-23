// ABOUTME: Tests for ReportPage wizard shell — stepper rendering, contextual
// ABOUTME: nav controls (Skip/Back), Next advancing to the next step, an
// ABOUTME: always-enabled Next that surfaces errors on an invalid attempt,
// ABOUTME: and step-registered nav handlers intercepting Back/Next.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent, inject, type Ref } from 'vue'
import ReportPage from '../ReportPage.vue'
import ExitDialog from '@/components/wizard/ExitDialog.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useMyCasesStore } from '@/stores/myCases'
import { WIZARD_CAN_ADVANCE_KEY, WIZARD_SHOW_ERRORS_KEY } from '@/composables/useWizardValidity'
import { WIZARD_NAV_KEY, type WizardNavHandlers } from '@/composables/useWizardNav'

const Stub = (text: string) =>
  defineComponent({ setup: () => () => text, template: `<div>${text}</div>` })

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub('landing') },
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
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

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
    expect(w.find('[data-test="wizard-back"]').exists()).toBe(false)
    router.push('/report/issue-type')
    await flushPromises()
    expect(w.find('[data-test="wizard-back"]').exists()).toBe(true)
  })

  it('shows the Exit link on every step and no longer shows Reset', async () => {
    const router = makeRouter()
    router.push('/report')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()
    expect(w.find('[data-test="wizard-exit"]').exists()).toBe(true)
    expect(w.find('[data-test="wizard-reset"]').exists()).toBe(false)

    router.push('/report/review')
    await flushPromises()
    expect(w.find('[data-test="wizard-exit"]').exists()).toBe(true)
  })

  it('clicking Exit opens the ExitDialog', async () => {
    const router = makeRouter()
    router.push('/report')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()

    expect(w.findComponent(ExitDialog).props('open')).toBe(false)
    await w.find('[data-test="wizard-exit"]').trigger('click')
    expect(w.findComponent(ExitDialog).props('open')).toBe(true)
  })

  it('saves a draft, resets the wizard, and navigates home when ExitDialog emits save', async () => {
    const router = makeRouter()
    router.push('/report')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()

    const submission = useReportSubmissionStore()
    submission.setCategory('Illegal Dumping')
    submission.setQuestion('Q1', 'Yes')
    submission.setDescription('Trash on the corner')
    submission.setPrivacy(true)

    await w.find('[data-test="wizard-exit"]').trigger('click')
    await w.findComponent(ExitDialog).vm.$emit('save')
    await flushPromises()

    const myCases = useMyCasesStore()
    expect(myCases.drafts[0]).toMatchObject({
      category: 'Illegal Dumping',
      customFields: { Q1: 'Yes' },
      description: 'Trash on the corner',
      publicVisibility: true,
    })
    expect(submission.category).toBeNull()
    expect(submission.customFields).toEqual({})
    expect(submission.description).toBe('')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('resets the wizard and navigates home without saving when ExitDialog emits discard', async () => {
    const router = makeRouter()
    router.push('/report')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()

    const submission = useReportSubmissionStore()
    submission.setCategory('Illegal Dumping')

    await w.find('[data-test="wizard-exit"]').trigger('click')
    await w.findComponent(ExitDialog).vm.$emit('discard')
    await flushPromises()

    expect(useMyCasesStore().drafts).toHaveLength(0)
    expect(submission.category).toBeNull()
    expect(router.currentRoute.value.path).toBe('/')
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

  it('does not disable Next when the active step sets canAdvance to false', async () => {
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

    expect(w.find('[data-test="wizard-next"]').attributes('disabled')).toBeUndefined()
  })

  it('clicking Next with canAdvance=false does not navigate and flips showErrors to true', async () => {
    let showErrors: Ref<boolean> | undefined

    const BlockingStep = defineComponent({
      setup() {
        const canAdvance = inject<Ref<boolean>>(WIZARD_CAN_ADVANCE_KEY)
        if (canAdvance) canAdvance.value = false
        showErrors = inject<Ref<boolean>>(WIZARD_SHOW_ERRORS_KEY)
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

    expect(showErrors?.value).toBe(false)

    await w.find('[data-test="wizard-next"]').trigger('click')
    await flushPromises()

    expect(w.text()).toContain('blocking-step')
    expect(w.text()).not.toContain('issue-step')
    expect(showErrors?.value).toBe(true)
  })

  it('lets a registered nav handler consume Next and Back without navigating', async () => {
    const nextHandler = vi.fn(() => true)
    const backHandler = vi.fn(() => true)

    const NavStep = defineComponent({
      setup() {
        const nav = inject<Ref<WizardNavHandlers | null>>(WIZARD_NAV_KEY)
        if (nav) nav.value = { next: nextHandler, back: backHandler }
        return {}
      },
      template: '<div>nav-step</div>',
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/report',
          component: ReportPage,
          children: [
            { path: '', component: Stub('image-step') },
            { path: 'issue-type', component: NavStep },
          ],
        },
      ],
    })

    router.push('/report/issue-type')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()

    await w.find('[data-test="wizard-next"]').trigger('click')
    await flushPromises()
    expect(nextHandler).toHaveBeenCalledTimes(1)
    expect(w.text()).toContain('nav-step')

    await w.find('[data-test="wizard-back"]').trigger('click')
    await flushPromises()
    expect(backHandler).toHaveBeenCalledTimes(1)
    expect(w.text()).toContain('nav-step')
  })

  it('navigates to the next step when the nav handler returns false', async () => {
    const NavStep = defineComponent({
      setup() {
        const nav = inject<Ref<WizardNavHandlers | null>>(WIZARD_NAV_KEY)
        if (nav) nav.value = { next: () => false, back: () => false }
        return {}
      },
      template: '<div>nav-step</div>',
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/report',
          component: ReportPage,
          children: [
            { path: '', component: Stub('image-step') },
            { path: 'issue-type', component: NavStep },
            { path: 'location', component: Stub('location-step') },
          ],
        },
      ],
    })

    router.push('/report/issue-type')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()

    await w.find('[data-test="wizard-next"]').trigger('click')
    await flushPromises()

    expect(w.text()).toContain('location-step')
  })

  it('navigates to the previous step when the nav handler returns false', async () => {
    const NavStep = defineComponent({
      setup() {
        const nav = inject<Ref<WizardNavHandlers | null>>(WIZARD_NAV_KEY)
        if (nav) nav.value = { next: () => false, back: () => false }
        return {}
      },
      template: '<div>nav-step</div>',
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/report',
          component: ReportPage,
          children: [
            { path: '', component: Stub('image-step') },
            { path: 'issue-type', component: NavStep },
            { path: 'location', component: Stub('location-step') },
          ],
        },
      ],
    })

    router.push('/report/issue-type')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()

    await w.find('[data-test="wizard-back"]').trigger('click')
    await flushPromises()

    expect(w.text()).toContain('image-step')
  })
})
