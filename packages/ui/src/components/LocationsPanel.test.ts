// ABOUTME: Tests for LocationsPanel — default MapCard rendering vs the location-card
// ABOUTME: slot, and wrapper behavior (events, classes, data attrs) parity in both branches.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LocationsPanel from './LocationsPanel.vue'
import type { BasicLocation } from '../types'

const MapCardStub = {
  name: 'MapCard',
  props: ['heading', 'subheader'],
  template: '<div class="mapcard-stub">{{ heading }}</div>',
}

function locations(): BasicLocation[] {
  return [
    {
      id: 'a1',
      name: 'Pothole Repair',
      latitude: 39.95,
      longitude: -75.16,
      locationCardInfo: { heading: 'Pothole Repair', subheader: '1234 Market St' },
    },
    {
      id: 'b2',
      name: 'Graffiti Removal',
      latitude: 39.96,
      longitude: -75.17,
      locationCardInfo: { heading: 'Graffiti Removal', subheader: '5 N Broad St' },
    },
  ]
}

function mountDefault(extra: Record<string, unknown> = {}) {
  return mount(LocationsPanel, {
    props: { locations: locations(), ...extra },
    global: { stubs: { MapCard: MapCardStub } },
  })
}

function mountWithSlot(extra: Record<string, unknown> = {}) {
  return mount(LocationsPanel, {
    props: { locations: locations(), ...extra },
    slots: {
      'location-card': `<template #location-card="{ location }">
        <span class="custom-card">{{ location.name }}</span>
      </template>`,
    },
    global: { stubs: { MapCard: MapCardStub } },
  })
}

describe('LocationsPanel - default branch (no slot)', () => {
  it('renders a MapCard per location with locationCardInfo applied', () => {
    const w = mountDefault()
    const cards = w.findAll('.mapcard-stub')
    expect(cards).toHaveLength(2)
    expect(cards[0].text()).toBe('Pothole Repair')
  })

  it('keeps wrapper behavior: data-location-id, click → select, hover events', async () => {
    const w = mountDefault()
    const first = w.find('[data-location-id="a1"]')
    expect(first.exists()).toBe(true)
    await first.trigger('click')
    expect(w.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'a1' })
    await first.trigger('mouseenter')
    expect(w.emitted('hover')?.[0]).toEqual(['a1'])
    await first.trigger('mouseleave')
    expect(w.emitted('hover-end')).toBeTruthy()
  })

  it('applies hovered/selected classes from props', () => {
    const w = mountDefault({ hoveredId: 'a1', selectedId: 'b2' })
    expect(w.find('[data-location-id="a1"]').classes()).toContain('location-card--hovered')
    expect(w.find('[data-location-id="b2"]').classes()).toContain('location-card--selected')
  })

  it('selects via Enter keydown+keyup', async () => {
    const w = mountDefault()
    const first = w.find('[data-location-id="a1"]')
    await first.trigger('keydown', { key: 'Enter' })
    await first.trigger('keyup', { key: 'Enter' })
    expect(w.emitted('select')).toHaveLength(1)
  })
})

describe('LocationsPanel - location-card slot branch', () => {
  it('renders the slot content with the location, and no MapCard', () => {
    const w = mountWithSlot()
    const custom = w.findAll('.custom-card')
    expect(custom).toHaveLength(2)
    expect(custom[0].text()).toBe('Pothole Repair')
    expect(w.find('.mapcard-stub').exists()).toBe(false)
  })

  it('keeps identical wrapper behavior: data attr, tabindex, click, hover, classes', async () => {
    const w = mountWithSlot({ hoveredId: 'a1', selectedId: 'b2' })
    const first = w.find('[data-location-id="a1"]')
    expect(first.exists()).toBe(true)
    expect(first.attributes('tabindex')).toBe('0')
    expect(first.classes()).toContain('location-card')
    expect(first.classes()).toContain('location-card--hovered')
    expect(w.find('[data-location-id="b2"]').classes()).toContain('location-card--selected')
    await first.trigger('click')
    expect(w.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'a1' })
    await first.trigger('mouseenter')
    expect(w.emitted('hover')?.[0]).toEqual(['a1'])
  })

  it('selects via Enter keydown+keyup like the default branch', async () => {
    const w = mountWithSlot()
    const first = w.find('[data-location-id="a1"]')
    await first.trigger('keydown', { key: 'Enter' })
    await first.trigger('keyup', { key: 'Enter' })
    expect(w.emitted('select')).toHaveLength(1)
  })
})

describe('LocationsPanel - filters slot', () => {
  it('renders the filters slot between the search box and the location list', () => {
    const w = mount(LocationsPanel, {
      props: { locations: locations(), locationSearch: 'Search by address or ZIP' },
      slots: { filters: '<div class="my-filters">Chips</div>' },
      global: { stubs: { MapCard: MapCardStub } },
    })
    const html = w.html()
    const searchIdx = html.indexOf('location-search')
    const filtersIdx = html.indexOf('my-filters')
    const listIdx = html.indexOf('location-list')
    expect(searchIdx).toBeGreaterThan(-1)
    expect(searchIdx).toBeLessThan(filtersIdx)
    expect(filtersIdx).toBeLessThan(listIdx)
  })

  it('renders nothing extra when no filters slot content is given', () => {
    const w = mountDefault()
    expect(w.find('.my-filters').exists()).toBe(false)
  })
})

describe('LocationsPanel - count label', () => {
  it('does not render a count line when countNoun is not provided', () => {
    const w = mountDefault()
    expect(w.find('.location-count').exists()).toBe(false)
  })

  it('renders the pluralized count with the given noun', () => {
    const w = mountDefault({ countNoun: 'report' })
    expect(w.find('.location-count').text()).toBe('2 reports')
  })

  it('renders the singular noun for a single result', () => {
    const w = mountDefault({ locations: [locations()[0]], countNoun: 'report' })
    expect(w.find('.location-count').text()).toBe('1 report')
  })

  it('shows "No locations match" when there are no results', () => {
    const w = mountDefault({ locations: [], countNoun: 'report' })
    expect(w.find('.location-count').text()).toBe('No locations match')
  })

  it('renders the count line between the filters slot and the location list', () => {
    const w = mount(LocationsPanel, {
      props: { locations: locations(), countNoun: 'report' },
      slots: { filters: '<div class="my-filters">Chips</div>' },
      global: { stubs: { MapCard: MapCardStub } },
    })
    const html = w.html()
    const filtersIdx = html.indexOf('my-filters')
    const countIdx = html.indexOf('location-count')
    const listIdx = html.indexOf('location-list')
    expect(filtersIdx).toBeLessThan(countIdx)
    expect(countIdx).toBeLessThan(listIdx)
  })
})
