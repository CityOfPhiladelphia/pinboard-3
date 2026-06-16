// ABOUTME: Tests for FilterChips — leading All Filters chip, icon chips, selection
// ABOUTME: emit + aria-pressed, and the overflow scroll chevron.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterChips from './FilterChips.vue'

const OPTIONS = [
  { value: 'Pothole Repair', label: 'Pothole Repair' },
  { value: 'Graffiti Removal', label: 'Graffiti Removal' },
]

let triggerResize: () => void = () => {}

beforeEach(() => {
  triggerResize = () => {}
  vi.stubGlobal('ResizeObserver', class {
    constructor(cb: () => void) {
      triggerResize = cb
    }
    observe = vi.fn()
    disconnect = vi.fn()
  })
})

afterEach(() => vi.unstubAllGlobals())

function mountChips(modelValue = 'all') {
  return mount(FilterChips, {
    props: { options: OPTIONS, modelValue },
    global: { stubs: { FontAwesomeIcon: true } },
  })
}

function setOverflow(w: ReturnType<typeof mountChips>, overflowing: boolean) {
  const row = w.find('.filter-chips__row').element as HTMLElement
  Object.defineProperty(row, 'scrollWidth', { value: overflowing ? 900 : 400, configurable: true })
  Object.defineProperty(row, 'clientWidth', { value: 400, configurable: true })
}

describe('FilterChips', () => {
  it('renders the leading All Filters chip plus one chip per option', () => {
    const chips = mountChips().findAll('button.filter-chips__chip')
    expect(chips.map((c) => c.text())).toEqual(['All Filters', 'Pothole Repair', 'Graffiti Removal'])
  })

  it('marks the selected chip with aria-pressed', () => {
    const w = mountChips('Pothole Repair')
    const chips = w.findAll('button.filter-chips__chip')
    expect(chips[0].attributes('aria-pressed')).toBe('false')
    expect(chips[1].attributes('aria-pressed')).toBe('true')
  })

  it('All Filters is pressed when the model is "all"', () => {
    const w = mountChips('all')
    expect(w.findAll('button.filter-chips__chip')[0].attributes('aria-pressed')).toBe('true')
  })

  it('emits update:modelValue on chip click', async () => {
    const w = mountChips()
    await w.findAll('button.filter-chips__chip')[2].trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['Graffiti Removal'])
    await w.findAll('button.filter-chips__chip')[0].trigger('click')
    expect(w.emitted('update:modelValue')?.[1]).toEqual(['all'])
  })

  it('hides the scroll chevron when the row does not overflow', async () => {
    const w = mountChips()
    setOverflow(w, false)
    triggerResize()
    await w.vm.$nextTick()
    expect(w.find('.filter-chips__scroll').exists()).toBe(false)
  })

  it('shows the chevron when overflowing and scrolls the row on click', async () => {
    const w = mountChips()
    setOverflow(w, true)
    triggerResize()
    await w.vm.$nextTick()
    const row = w.find('.filter-chips__row').element as HTMLElement
    row.scrollBy = vi.fn()
    await w.find('.filter-chips__scroll').trigger('click')
    expect(row.scrollBy).toHaveBeenCalledWith({ left: 320, behavior: 'smooth' })
  })

  it('recomputes overflow when options change', async () => {
    const w = mountChips()
    setOverflow(w, false)
    triggerResize()
    await w.vm.$nextTick()
    expect(w.find('.filter-chips__scroll').exists()).toBe(false)

    setOverflow(w, true)
    await w.setProps({ options: [...OPTIONS, { value: 'X', label: 'X' }] })
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(w.find('.filter-chips__scroll').exists()).toBe(true)
  })

  it('has accessible group role and label on the chip row', () => {
    const row = mountChips().find('.filter-chips__row')
    expect(row.attributes('role')).toBe('group')
    expect(row.attributes('aria-label')).toBe('Filter reports by type')
  })

  it('applies white to selected chip icon and service color to unselected', () => {
    const w = mountChips('Pothole Repair')
    const chips = w.findAll('button.filter-chips__chip')
    const selectedIcon = chips[1].find('font-awesome-icon-stub')
    const unselectedIcon = chips[2].find('font-awesome-icon-stub')
    expect(selectedIcon.attributes('style')).toMatch(/rgb\(255, 255, 255\)/)
    expect(unselectedIcon.attributes('style')).not.toMatch(/rgb\(255, 255, 255\)/)
  })

  it('observes the row with a ResizeObserver and disconnects on unmount', () => {
    const observe = vi.fn()
    const disconnect = vi.fn()
    vi.stubGlobal('ResizeObserver', class {
      observe = observe
      disconnect = disconnect
    })
    const w = mount(FilterChips, { props: { options: [], modelValue: 'all' } })
    expect(observe).toHaveBeenCalledTimes(1)
    w.unmount()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })
})
