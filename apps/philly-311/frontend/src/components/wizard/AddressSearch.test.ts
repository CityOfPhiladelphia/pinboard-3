// ABOUTME: Tests for AddressSearch — debounced autocomplete, result rendering,
// ABOUTME: pick-resolution + select emission, list-stays-closed after pick, errors.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import AddressSearch from './AddressSearch.vue'

const mockAutocompleteAddresses = vi.fn()
const mockSearchAddress = vi.fn()

vi.mock('@/composables/useAis', () => ({
  autocompleteAddresses: (...args: unknown[]) => mockAutocompleteAddresses(...args),
  searchAddress: (...args: unknown[]) => mockSearchAddress(...args),
}))

const FEATURE = {
  streetAddress: '1234 MARKET ST',
  zipCode: '19107',
  lat: 39.9526,
  lng: -75.1652,
}

async function typeAndSettle(wrapper: VueWrapper, text: string) {
  await wrapper.find('input').setValue(text)
  await vi.advanceTimersByTimeAsync(260)
  await wrapper.vm.$nextTick()
}

beforeEach(() => {
  vi.useFakeTimers()
  mockAutocompleteAddresses.mockReset()
  mockSearchAddress.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AddressSearch - debounce + results', () => {
  it('calls autocompleteAddresses after the debounce and renders results with city line', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])

    const wrapper = mount(AddressSearch)
    await wrapper.find('input').setValue('1234')
    expect(mockAutocompleteAddresses).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(260)
    await wrapper.vm.$nextTick()
    expect(mockAutocompleteAddresses).toHaveBeenCalledTimes(1)
    expect(mockAutocompleteAddresses.mock.calls[0][0]).toBe('1234')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('1234 MARKET ST')
    expect(wrapper.text()).toContain('Philadelphia, PA')
  })

  it('does not fetch when query is empty', async () => {
    const wrapper = mount(AddressSearch)
    await wrapper.find('input').setValue('')
    await vi.advanceTimersByTimeAsync(260)
    expect(mockAutocompleteAddresses).not.toHaveBeenCalled()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })
})

describe('AddressSearch - picking a result', () => {
  it('resolves via searchAddress, emits select, echoes the address, closes the list', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])
    mockSearchAddress.mockResolvedValue(FEATURE)

    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')

    await wrapper.find('[role="listbox"] [role="option"]').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    await wrapper.vm.$nextTick()

    expect(mockSearchAddress).toHaveBeenCalledWith('1234 MARKET ST')
    expect(wrapper.emitted('select')?.[0]).toEqual([FEATURE])
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('1234 MARKET ST')
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('keeps the list closed after the pick echo re-fires the debounced fetch', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])
    mockSearchAddress.mockResolvedValue(FEATURE)

    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')
    await wrapper.find('[role="listbox"] [role="option"]').trigger('click')
    await vi.advanceTimersByTimeAsync(0)

    // The echoed query re-fires the debounced autocomplete; the list must not reopen.
    await vi.advanceTimersByTimeAsync(300)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(wrapper.find('.address-search__loading').exists()).toBe(false)
  })

  it('shows the searching line while a pick is resolving', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])
    let resolve!: (v: unknown) => void
    mockSearchAddress.mockReturnValue(
      new Promise((r) => {
        resolve = r
      }),
    )

    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')

    await wrapper.find('[role="listbox"] [role="option"]').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.address-search__loading').exists()).toBe(true)

    resolve(FEATURE)
    await vi.advanceTimersByTimeAsync(0)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.address-search__loading').exists()).toBe(false)
    expect(wrapper.emitted('select')?.[0]).toEqual([FEATURE])
  })

  it('shows an error and does not emit when searchAddress returns null', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])
    mockSearchAddress.mockResolvedValue(null)

    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')
    await wrapper.find('[role="listbox"] [role="option"]').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('select')).toBeFalsy()
    expect(wrapper.find('.address-search__error').text()).toContain("Couldn't resolve")
  })

  it('shows "Couldn\'t resolve" and does not emit when searchAddress throws', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])
    mockSearchAddress.mockRejectedValue(new Error('AIS search failed: 500'))

    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')
    await wrapper.find('[role="listbox"] [role="option"]').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('select')).toBeFalsy()
    expect(wrapper.find('.address-search__error').text()).toContain("Couldn't resolve")
  })
})

describe('AddressSearch - error handling', () => {
  it('shows an error message when the autocomplete fetch fails', async () => {
    mockAutocompleteAddresses.mockRejectedValue(new Error('AIS autocomplete failed: 500'))

    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')

    expect(wrapper.find('.address-search__error').text()).toContain('AIS autocomplete failed')
  })
})

describe('AddressSearch - ARIA combobox contract', () => {
  it('input has combobox role and aria attributes when closed', () => {
    const wrapper = mount(AddressSearch)
    const input = wrapper.find('input')
    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('aria-autocomplete')).toBe('list')
    expect(input.attributes('aria-controls')).toBe('address-search-listbox')
    expect(input.attributes('aria-expanded')).toBe('false')
  })

  it('sets aria-expanded="true" when results are shown', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])
    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('true')
  })

  it('options are <li role="option"> with no inner button', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])
    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')
    const option = wrapper.find('[role="listbox"] [role="option"]')
    expect(option.exists()).toBe(true)
    expect(option.find('button').exists()).toBe(false)
  })
})

describe('AddressSearch - keyboard navigation', () => {
  it('ArrowDown sets aria-activedescendant to first option, second ArrowDown moves to second', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
      { address: '1234 MARKET ST UNIT 2', searchAddress: '1234 MARKET ST UNIT 2' },
    ])
    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')
    const input = wrapper.find('input')

    expect(input.attributes('aria-activedescendant')).toBeFalsy()

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe('address-option-0')

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe('address-option-1')
  })

  it('ArrowUp moves focus back after ArrowDown', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
      { address: '1234 MARKET ST UNIT 2', searchAddress: '1234 MARKET ST UNIT 2' },
    ])
    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')
    const input = wrapper.find('input')

    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe('address-option-1')

    await input.trigger('keydown', { key: 'ArrowUp' })
    expect(input.attributes('aria-activedescendant')).toBe('address-option-0')
  })

  it('Enter while an option is active selects it', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])
    mockSearchAddress.mockResolvedValue(FEATURE)

    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')
    const input = wrapper.find('input')

    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })
    await vi.advanceTimersByTimeAsync(0)
    await wrapper.vm.$nextTick()

    expect(mockSearchAddress).toHaveBeenCalledWith('1234 MARKET ST')
    expect(wrapper.emitted('select')?.[0]).toEqual([FEATURE])
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('Escape closes the list and sets aria-expanded to false', async () => {
    mockAutocompleteAddresses.mockResolvedValue([
      { address: '1234 MARKET ST', searchAddress: '1234 MARKET ST' },
    ])
    const wrapper = mount(AddressSearch)
    await typeAndSettle(wrapper, '1234')

    expect(wrapper.find('[role="listbox"]').exists()).toBe(true)

    await wrapper.find('input').trigger('keydown', { key: 'Escape' })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
    expect(wrapper.find('input').attributes('aria-expanded')).toBe('false')
  })
})
