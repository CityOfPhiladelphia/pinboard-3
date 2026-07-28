// ABOUTME: Tests for FilterChips — adapts the finder's single-select string filter
// ABOUTME: to FilterChipGroup toggle chips and a FilterPanel opened via All Filters.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { FilterChipGroup } from '@phila/phila-ui-filter-chip'
import { FilterPanel } from '@phila/phila-ui-filter-panel'
import type { FilterDefinition } from '@phila/phila-ui-core'
import FilterChips from '../FilterChips.vue'

const OPTIONS = [
  { value: 'Pothole Repair', label: 'Pothole Repair' },
  { value: 'Graffiti Removal', label: 'Graffiti Removal' },
]

function mountChips(modelValue = 'all') {
  return mount(FilterChips, {
    props: { options: OPTIONS, modelValue },
  })
}

describe('FilterChips', () => {
  it('renders a toggle FilterDefinition per option with the service-type icon color', () => {
    const filters = mountChips().findComponent(FilterChipGroup).props('filters') as
      FilterDefinition[] | undefined
    expect(filters?.map((f) => f.key)).toEqual(['Pothole Repair', 'Graffiti Removal'])
    for (const f of filters ?? []) {
      expect(f.choices).toBeUndefined()
      expect(f.icon).toBeTruthy()
      expect(f.iconColor).toBeTruthy()
    }
  })

  it('shows the leading All Filters button', () => {
    const group = mountChips().findComponent(FilterChipGroup)
    expect(group.props('filterButton')).toBe(true)
    expect(group.props('filterButtonText')).toBe('All Filters')
  })

  it('maps the selected value into the group model', () => {
    const group = mountChips('Pothole Repair').findComponent(FilterChipGroup)
    expect(group.props('modelValue')).toEqual({
      'Pothole Repair': true,
      'Graffiti Removal': false,
    })
  })

  it('marks nothing selected when the filter is all', () => {
    const group = mountChips().findComponent(FilterChipGroup)
    expect(group.props('modelValue')).toEqual({
      'Pothole Repair': false,
      'Graffiti Removal': false,
    })
  })

  it('emits the newly toggled value, single-select over the previous one', async () => {
    const w = mountChips('Pothole Repair')
    await w
      .findComponent(FilterChipGroup)
      .vm.$emit('update:modelValue', { 'Pothole Repair': true, 'Graffiti Removal': true })
    expect(w.emitted('update:modelValue')?.[0]?.[0]).toBe('Graffiti Removal')
  })

  it('emits all when the active chip is toggled off', async () => {
    const w = mountChips('Pothole Repair')
    await w
      .findComponent(FilterChipGroup)
      .vm.$emit('update:modelValue', { 'Pothole Repair': false, 'Graffiti Removal': false })
    expect(w.emitted('update:modelValue')?.[0]?.[0]).toBe('all')
  })

  it('does not emit when the group echoes the current selection (mount normalize)', async () => {
    const w = mountChips('Pothole Repair')
    await w
      .findComponent(FilterChipGroup)
      .vm.$emit('update:modelValue', { 'Pothole Repair': true, 'Graffiti Removal': false })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('does not render the filter panel until All Filters is pressed', () => {
    expect(mountChips().findComponent(FilterPanel).exists()).toBe(false)
  })

  it('opens the filter panel when All Filters is pressed', async () => {
    const w = mountChips()
    await w.findComponent(FilterChipGroup).vm.$emit('open-filters')
    expect(w.findComponent(FilterPanel).exists()).toBe(true)
  })

  it('closes the filter panel when the panel emits close', async () => {
    const w = mountChips()
    await w.findComponent(FilterChipGroup).vm.$emit('open-filters')
    await w.findComponent(FilterPanel).vm.$emit('close')
    expect(w.findComponent(FilterPanel).exists()).toBe(false)
  })

  it('disables the panel search box (no design for it)', async () => {
    const w = mountChips()
    await w.findComponent(FilterChipGroup).vm.$emit('open-filters')
    expect(w.findComponent(FilterPanel).props('searchable')).toBe(false)
  })

  it('passes a single-select service-type filter definition to the panel', async () => {
    const w = mountChips()
    await w.findComponent(FilterChipGroup).vm.$emit('open-filters')
    const filters = w.findComponent(FilterPanel).props('filters') as FilterDefinition[]
    expect(filters).toEqual([
      {
        key: 'serviceType',
        label: 'Service Type',
        choices: [
          { text: 'Pothole Repair', value: 'Pothole Repair' },
          { text: 'Graffiti Removal', value: 'Graffiti Removal' },
        ],
      },
    ])
  })

  it('maps the selected value into the panel model, in sync with the chips', async () => {
    const w = mountChips('Pothole Repair')
    await w.findComponent(FilterChipGroup).vm.$emit('open-filters')
    expect(w.findComponent(FilterPanel).props('modelValue')).toEqual({
      serviceType: { 'Pothole Repair': true, 'Graffiti Removal': false },
    })
  })

  it('marks nothing selected in the panel when the filter is all', async () => {
    const w = mountChips()
    await w.findComponent(FilterChipGroup).vm.$emit('open-filters')
    expect(w.findComponent(FilterPanel).props('modelValue')).toEqual({
      serviceType: { 'Pothole Repair': false, 'Graffiti Removal': false },
    })
  })

  it('emits the value picked in the panel', async () => {
    const w = mountChips('Pothole Repair')
    await w.findComponent(FilterChipGroup).vm.$emit('open-filters')
    await w.findComponent(FilterPanel).vm.$emit('update:modelValue', {
      serviceType: { 'Pothole Repair': false, 'Graffiti Removal': true },
    })
    expect(w.emitted('update:modelValue')?.[0]?.[0]).toBe('Graffiti Removal')
  })

  it('emits all when the panel selection is cleared', async () => {
    const w = mountChips('Pothole Repair')
    await w.findComponent(FilterChipGroup).vm.$emit('open-filters')
    await w.findComponent(FilterPanel).vm.$emit('update:modelValue', {
      serviceType: { 'Pothole Repair': false, 'Graffiti Removal': false },
    })
    expect(w.emitted('update:modelValue')?.[0]?.[0]).toBe('all')
  })

  it('does not emit when the panel echoes the current selection', async () => {
    const w = mountChips('Pothole Repair')
    await w.findComponent(FilterChipGroup).vm.$emit('open-filters')
    await w.findComponent(FilterPanel).vm.$emit('update:modelValue', {
      serviceType: { 'Pothole Repair': true, 'Graffiti Removal': false },
    })
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})
