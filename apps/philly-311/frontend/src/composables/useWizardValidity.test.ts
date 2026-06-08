// ABOUTME: Tests useWizardValidity — mirrors a computed into wizard:canAdvance,
// ABOUTME: resets to true on unmount, and is a no-op when not provided.
import { describe, expect, it } from 'vitest'
import { computed, defineComponent, h, ref, type Ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useWizardValidity } from './useWizardValidity'

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
})
