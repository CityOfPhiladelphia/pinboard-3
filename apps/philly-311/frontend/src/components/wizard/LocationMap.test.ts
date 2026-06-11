// ABOUTME: Tests for LocationMap — empty-state map without marker, marker render,
// ABOUTME: dragend move emission, and outOfBounds emission for non-Philly points.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { Map as PhilaMap, MapMarker } from '@phila/phila-ui-map-core'
import LocationMap from './LocationMap.vue'

const IN_PHILLY = { lat: 39.9526, lng: -75.1652 }
const WILMINGTON = { lat: 39.7447, lng: -75.5484 }

describe('LocationMap - no location', () => {
  it('renders the map without a marker and emits nothing', () => {
    const wrapper = mount(LocationMap, { props: { location: null } })
    expect(wrapper.findComponent(PhilaMap).exists()).toBe(true)
    expect(wrapper.findComponent(MapMarker).exists()).toBe(false)
    expect(wrapper.emitted('outOfBounds')).toBeFalsy()
  })
})

describe('LocationMap - in-bounds location', () => {
  it('renders a marker and does not emit outOfBounds', () => {
    const wrapper = mount(LocationMap, { props: { location: IN_PHILLY } })
    expect(wrapper.findComponent(MapMarker).exists()).toBe(true)
    expect(wrapper.emitted('outOfBounds')).toBeFalsy()
  })

  it('emits move with {lat, lng} when the marker emits dragend', async () => {
    const wrapper = mount(LocationMap, { props: { location: IN_PHILLY } })
    await wrapper.findComponent(MapMarker).vm.$emit('dragend', { lng: -75.16, lat: 39.95 })
    expect(wrapper.emitted('move')?.[0]).toEqual([{ lat: 39.95, lng: -75.16 }])
  })
})

describe('LocationMap - out-of-bounds location', () => {
  it('emits outOfBounds when mounted outside Philadelphia', () => {
    const wrapper = mount(LocationMap, { props: { location: WILMINGTON } })
    expect(wrapper.emitted('outOfBounds')).toBeTruthy()
  })

  it('emits outOfBounds when the location moves outside Philadelphia', async () => {
    const wrapper = mount(LocationMap, { props: { location: IN_PHILLY } })
    expect(wrapper.emitted('outOfBounds')).toBeFalsy()
    await wrapper.setProps({ location: WILMINGTON })
    expect(wrapper.emitted('outOfBounds')).toBeTruthy()
  })
})
