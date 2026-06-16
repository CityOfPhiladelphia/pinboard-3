// ABOUTME: Tests for FilterChips — leading All Filters chip, icon chips, selection
// ABOUTME: emit + aria-pressed, drag-to-scroll, and the directional scroll chevrons.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterChips from '../FilterChips.vue'

const OPTIONS = [
  { value: 'Pothole Repair', label: 'Pothole Repair' },
  { value: 'Graffiti Removal', label: 'Graffiti Removal' },
]

let triggerResize: () => void = () => {}

beforeEach(() => {
  triggerResize = () => {}
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(cb: () => void) {
        triggerResize = cb
      }
      observe = vi.fn()
      disconnect = vi.fn()
    },
  )
})

afterEach(() => vi.unstubAllGlobals())

function mountChips(modelValue = 'all') {
  return mount(FilterChips, {
    props: { options: OPTIONS, modelValue },
    global: { stubs: { FontAwesomeIcon: true } },
  })
}

function firePointer(row: HTMLElement, type: string, props: Record<string, unknown>) {
  const ev = new Event(type, { bubbles: true })
  Object.assign(ev, props)
  row.dispatchEvent(ev)
}

function setScroll(
  w: ReturnType<typeof mountChips>,
  pos: { scrollLeft: number; scrollWidth: number; clientWidth: number },
) {
  const row = w.find('.filter-chips__row').element as HTMLElement
  Object.defineProperty(row, 'scrollLeft', {
    value: pos.scrollLeft,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(row, 'scrollWidth', { value: pos.scrollWidth, configurable: true })
  Object.defineProperty(row, 'clientWidth', { value: pos.clientWidth, configurable: true })
  return row
}

describe('FilterChips', () => {
  it('renders the leading All Filters chip plus one chip per option', () => {
    const chips = mountChips().findAll('button.filter-chips__chip')
    expect(chips.map((c) => c.text())).toEqual([
      'All Filters',
      'Pothole Repair',
      'Graffiti Removal',
    ])
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

  it('hides both chevrons when the row does not overflow', async () => {
    const w = mountChips()
    setScroll(w, { scrollLeft: 0, scrollWidth: 400, clientWidth: 400 })
    triggerResize()
    await w.vm.$nextTick()
    expect(w.find('.filter-chips__scroll--left').exists()).toBe(false)
    expect(w.find('.filter-chips__scroll--right').exists()).toBe(false)
  })

  it('shows only the right chevron at the start of an overflowing row and scrolls right on click', async () => {
    const w = mountChips()
    const row = setScroll(w, { scrollLeft: 0, scrollWidth: 900, clientWidth: 400 })
    triggerResize()
    await w.vm.$nextTick()
    expect(w.find('.filter-chips__scroll--left').exists()).toBe(false)
    expect(w.find('.filter-chips__scroll--right').exists()).toBe(true)
    row.scrollBy = vi.fn()
    await w.find('.filter-chips__scroll--right').trigger('click')
    expect(row.scrollBy).toHaveBeenCalledWith({ left: 320, behavior: 'smooth' })
  })

  it('shows the left chevron once scrolled and scrolls left on click', async () => {
    const w = mountChips()
    const row = setScroll(w, { scrollLeft: 320, scrollWidth: 900, clientWidth: 400 })
    await w.find('.filter-chips__row').trigger('scroll')
    await w.vm.$nextTick()
    expect(w.find('.filter-chips__scroll--left').exists()).toBe(true)
    expect(w.find('.filter-chips__scroll--right').exists()).toBe(true)
    row.scrollBy = vi.fn()
    await w.find('.filter-chips__scroll--left').trigger('click')
    expect(row.scrollBy).toHaveBeenCalledWith({ left: -320, behavior: 'smooth' })
  })

  it('hides the right chevron at the end of the row', async () => {
    const w = mountChips()
    setScroll(w, { scrollLeft: 500, scrollWidth: 900, clientWidth: 400 })
    await w.find('.filter-chips__row').trigger('scroll')
    await w.vm.$nextTick()
    expect(w.find('.filter-chips__scroll--left').exists()).toBe(true)
    expect(w.find('.filter-chips__scroll--right').exists()).toBe(false)
  })

  it('recomputes chevrons when options change', async () => {
    const w = mountChips()
    setScroll(w, { scrollLeft: 0, scrollWidth: 400, clientWidth: 400 })
    triggerResize()
    await w.vm.$nextTick()
    expect(w.find('.filter-chips__scroll--right').exists()).toBe(false)

    setScroll(w, { scrollLeft: 0, scrollWidth: 900, clientWidth: 400 })
    await w.setProps({ options: [...OPTIONS, { value: 'X', label: 'X' }] })
    await w.vm.$nextTick()
    await w.vm.$nextTick()
    expect(w.find('.filter-chips__scroll--right').exists()).toBe(true)
  })

  it('drag scrolls the row horizontally with the mouse', async () => {
    const w = mountChips()
    const row = setScroll(w, { scrollLeft: 100, scrollWidth: 900, clientWidth: 400 })
    firePointer(row, 'pointerdown', { clientX: 200, button: 0, pointerId: 1, pointerType: 'mouse' })
    firePointer(row, 'pointermove', { clientX: 150, pointerId: 1, pointerType: 'mouse' })
    expect(row.scrollLeft).toBe(150)
    firePointer(row, 'pointerup', { pointerId: 1, pointerType: 'mouse' })
  })

  it('suppresses the chip click that ends a drag', async () => {
    const w = mountChips()
    const row = setScroll(w, { scrollLeft: 0, scrollWidth: 900, clientWidth: 400 })
    firePointer(row, 'pointerdown', { clientX: 200, button: 0, pointerId: 1, pointerType: 'mouse' })
    firePointer(row, 'pointermove', { clientX: 140, pointerId: 1, pointerType: 'mouse' })
    firePointer(row, 'pointerup', { pointerId: 1, pointerType: 'mouse' })
    await w.findAll('button.filter-chips__chip')[1].trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('ignores touch pointers so native touch scrolling is preserved', async () => {
    const w = mountChips()
    const row = setScroll(w, { scrollLeft: 100, scrollWidth: 900, clientWidth: 400 })
    firePointer(row, 'pointerdown', { clientX: 200, pointerId: 2, pointerType: 'touch' })
    firePointer(row, 'pointermove', { clientX: 150, pointerId: 2, pointerType: 'touch' })
    expect(row.scrollLeft).toBe(100)
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
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = observe
        disconnect = disconnect
      },
    )
    const w = mount(FilterChips, { props: { options: [], modelValue: 'all' } })
    expect(observe).toHaveBeenCalledTimes(1)
    w.unmount()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })
})
