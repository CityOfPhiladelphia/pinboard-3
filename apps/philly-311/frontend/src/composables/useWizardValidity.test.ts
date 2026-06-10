// ABOUTME: Tests useWizardValidity — mirrors a computed into wizard:canAdvance,
// ABOUTME: resets to true on unmount, and is a no-op when not provided.
import { describe, expect, it } from 'vitest'
import { computed, defineComponent, h, provide, ref, type Ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import { useWizardValidity, WIZARD_CAN_ADVANCE_KEY } from './useWizardValidity'

function harness(canAdvance: Ref<boolean>, validityFn: () => boolean) {
  const Child = defineComponent({
    setup() {
      useWizardValidity(computed(validityFn))
      return {}
    },
    render: () => h('div'),
  })
  const Root = defineComponent({
    components: { Child },
    setup() {
      return {}
    },
    render: () => h(Child),
  })
  return mount(Root, {
    global: { provide: { 'wizard:canAdvance': canAdvance } },
  })
}

describe('useWizardValidity', () => {
  it('writes the initial validity into canAdvance synchronously', () => {
    const canAdvance = ref(true)
    harness(canAdvance, () => false)
    expect(canAdvance.value).toBe(false)
  })

  it('updates canAdvance when the computed changes', async () => {
    const canAdvance = ref(true)
    const flag = ref(false)
    harness(canAdvance, () => flag.value)
    expect(canAdvance.value).toBe(false)
    flag.value = true
    await Promise.resolve()
    await Promise.resolve()
    expect(canAdvance.value).toBe(true)
  })

  it('resets canAdvance to true on unmount', () => {
    const canAdvance = ref(true)
    const wrapper = harness(canAdvance, () => false)
    expect(canAdvance.value).toBe(false)
    wrapper.unmount()
    expect(canAdvance.value).toBe(true)
  })

  it('is a no-op when no provider exists', () => {
    const Child = defineComponent({
      setup() {
        useWizardValidity(computed(() => false))
        return {}
      },
      render: () => h('div'),
    })
    expect(() => mount(Child)).not.toThrow()
  })

  it('preserves incoming step validity after navigation (no clobber on step transition)', async () => {
    const canAdvance = ref(true)

    const StepA = defineComponent({
      setup() {
        useWizardValidity(computed(() => true))
        return {}
      },
      render: () => h('div', 'step-a'),
    })

    const StepB = defineComponent({
      setup() {
        useWizardValidity(computed(() => false))
        return {}
      },
      render: () => h('div', 'step-b'),
    })

    const Shell = defineComponent({
      setup() {
        provide(WIZARD_CAN_ADVANCE_KEY, canAdvance)
        return {}
      },
      render: () => h(RouterView),
    })

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/a', component: StepA },
        { path: '/b', component: StepB },
      ],
    })

    router.push('/a')
    await router.isReady()

    mount(Shell, { global: { plugins: [router] } })
    await flushPromises()

    // StepA has validity=true; navigate to StepB which has validity=false
    router.push('/b')
    await flushPromises()

    // StepB's canAdvance=false must not be clobbered by StepA's unmount reset
    expect(canAdvance.value).toBe(false)
  })
})
