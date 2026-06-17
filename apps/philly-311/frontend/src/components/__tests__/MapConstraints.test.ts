// ABOUTME: Tests for MapConstraints — verifies setMaxBounds and setMinZoom are called
// ABOUTME: with Philadelphia bounds/minZoom when map is provided, and not called when null.
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MapConstraints from '../MapConstraints.vue'
import { PHILLY_MAP_BOUNDS } from '@/composables/useMapBounds'

function makeMap() {
  return {
    setMaxBounds: vi.fn(),
    setMinZoom: vi.fn(),
  }
}

describe('MapConstraints', () => {
  it('calls setMaxBounds and setMinZoom immediately when map is provided', () => {
    const map = makeMap()
    mount(MapConstraints, { props: { map } })
    expect(map.setMaxBounds).toHaveBeenCalledOnce()
    expect(map.setMaxBounds).toHaveBeenCalledWith(PHILLY_MAP_BOUNDS)
    expect(map.setMinZoom).toHaveBeenCalledOnce()
    expect(map.setMinZoom).toHaveBeenCalledWith(10.5)
  })

  it('does not call setMaxBounds or setMinZoom when map is null', () => {
    const map = makeMap()
    mount(MapConstraints, { props: { map: null } })
    expect(map.setMaxBounds).not.toHaveBeenCalled()
    expect(map.setMinZoom).not.toHaveBeenCalled()
  })

  it('does not call setMaxBounds or setMinZoom when map is undefined', () => {
    const map = makeMap()
    mount(MapConstraints, { props: { map: undefined } })
    expect(map.setMaxBounds).not.toHaveBeenCalled()
    expect(map.setMinZoom).not.toHaveBeenCalled()
  })

  it('calls setMaxBounds and setMinZoom when map transitions from null to a live instance', async () => {
    const map = makeMap()
    const w = mount(MapConstraints, { props: { map: null } })
    expect(map.setMaxBounds).not.toHaveBeenCalled()
    await w.setProps({ map })
    expect(map.setMaxBounds).toHaveBeenCalledOnce()
    expect(map.setMaxBounds).toHaveBeenCalledWith(PHILLY_MAP_BOUNDS)
    expect(map.setMinZoom).toHaveBeenCalledOnce()
    expect(map.setMinZoom).toHaveBeenCalledWith(10.5)
  })
})
