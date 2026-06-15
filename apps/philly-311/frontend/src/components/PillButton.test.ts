// ABOUTME: Tests for PillButton — variant styling, button vs RouterLink mode,
// ABOUTME: disabled state, click emission, and label slot.
import { describe, it, expect, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import PillButton from './PillButton.vue'

const stubs = { RouterLink: RouterLinkStub }

describe('PillButton', () => {
  it('renders a <button> with the slot label by default', () => {
    const w = mount(PillButton, { slots: { default: 'Submit' } })
    expect(w.element.tagName).toBe('BUTTON')
    expect(w.text()).toBe('Submit')
    expect(w.attributes('type')).toBe('button')
  })

  it('applies the primary variant by default and outline when asked', () => {
    const primary = mount(PillButton, { slots: { default: 'A' } })
    expect(primary.classes()).toContain('pill-button--primary')
    const outline = mount(PillButton, { props: { variant: 'outline' }, slots: { default: 'A' } })
    expect(outline.classes()).toContain('pill-button--outline')
  })

  it('renders a RouterLink when given a `to`', () => {
    const w = mount(PillButton, {
      props: { to: '/report' },
      slots: { default: 'Start' },
      global: { stubs },
    })
    const link = w.findComponent(RouterLinkStub)
    expect(link.exists()).toBe(true)
    expect(link.props('to')).toBe('/report')
    expect(w.find('button').exists()).toBe(false)
  })

  it('reflects disabled and forwards clicks via fallthrough in button mode', async () => {
    const onClick = vi.fn()
    const disabled = mount(PillButton, {
      props: { disabled: true },
      attrs: { onClick },
      slots: { default: 'X' },
    })
    expect(disabled.attributes('disabled')).toBeDefined()
    await disabled.trigger('click')
    expect(onClick).not.toHaveBeenCalled()

    // PillButton declares no emits; a consumer's @click falls through to the root <button>.
    const enabled = mount(PillButton, { attrs: { onClick }, slots: { default: 'X' } })
    await enabled.trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('passes through an explicit type in button mode', () => {
    const w = mount(PillButton, { props: { type: 'submit' }, slots: { default: 'Go' } })
    expect(w.attributes('type')).toBe('submit')
  })
})
