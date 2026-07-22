// ABOUTME: Tests useWizardNav — sets handlers into wizard:nav, resets to null
// ABOUTME: before unmount, and is a no-op when not provided.
import { describe, expect, it } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'
import { mount } from '@vue/test-utils'
import { useWizardNav, WIZARD_NAV_KEY, type WizardNavHandlers } from '../useWizardNav'

function harness(navRef: Ref<WizardNavHandlers | null>, handlers: WizardNavHandlers) {
  const Child = defineComponent({
    setup() {
      useWizardNav(handlers)
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
    global: { provide: { [WIZARD_NAV_KEY]: navRef } },
  })
}

describe('useWizardNav', () => {
  it('sets handlers into the nav ref on mount', () => {
    const navRef = ref<WizardNavHandlers | null>(null)
    const handlers = {
      next: () => true,
      back: () => false,
    }
    harness(navRef, handlers)
    expect(navRef.value).toStrictEqual(handlers)
  })

  it('resets nav ref to null on unmount', () => {
    const navRef = ref<WizardNavHandlers | null>(null)
    const handlers = {
      next: () => true,
      back: () => false,
    }
    const wrapper = harness(navRef, handlers)
    expect(navRef.value).toStrictEqual(handlers)
    wrapper.unmount()
    expect(navRef.value).toBeNull()
  })

  it('is a no-op when no provider exists', () => {
    const Child = defineComponent({
      setup() {
        useWizardNav({ next: () => true, back: () => false })
        return {}
      },
      render: () => h('div'),
    })
    expect(() => mount(Child)).not.toThrow()
  })
})
