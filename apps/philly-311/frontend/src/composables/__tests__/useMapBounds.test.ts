// ABOUTME: Tests for useMapBounds — applies maxBounds to the maplibre instance a
// ABOUTME: phila-ui-map-core <Map> exposes, in expose-proxy and raw-ref shapes.
import { describe, it, expect, vi } from 'vitest'
import { effectScope, nextTick, ref, shallowRef } from 'vue'
import { PHILLY_MAP_BOUNDS, PHILLY_MIN_ZOOM, useMapBounds } from '../useMapBounds'

// Template refs are shallow, so shallowRef mirrors production and keeps Vue
// from deep-unwrapping nested refs in the raw-ref-shape fixtures.

describe('useMapBounds - expose-proxy shape (refs auto-unwrapped)', () => {
  it('applies bounds when map and isLoaded arrive unwrapped', () => {
    const m = { setMaxBounds: vi.fn(), setMinZoom: vi.fn() }
    const mapRef = shallowRef({ map: m, isLoaded: true })
    const scope = effectScope()
    scope.run(() => useMapBounds(mapRef))
    expect(m.setMaxBounds).toHaveBeenCalledWith(PHILLY_MAP_BOUNDS)
    expect(m.setMinZoom).toHaveBeenCalledWith(PHILLY_MIN_ZOOM)
    scope.stop()
  })

  it('waits for isLoaded before applying bounds', async () => {
    const m = { setMaxBounds: vi.fn(), setMinZoom: vi.fn() }
    const mapRef = shallowRef({ map: m, isLoaded: false })
    const scope = effectScope()
    scope.run(() => useMapBounds(mapRef))
    expect(m.setMaxBounds).not.toHaveBeenCalled()
    mapRef.value = { map: m, isLoaded: true }
    await nextTick()
    expect(m.setMaxBounds).toHaveBeenCalledWith(PHILLY_MAP_BOUNDS)
    expect(m.setMinZoom).toHaveBeenCalledWith(PHILLY_MIN_ZOOM)
    scope.stop()
  })
})

describe('useMapBounds - raw-ref shape', () => {
  it('applies bounds when map and isLoaded arrive as refs', () => {
    const m = { setMaxBounds: vi.fn(), setMinZoom: vi.fn() }
    const mapRef = shallowRef({ map: { value: m }, isLoaded: { value: true } })
    const scope = effectScope()
    scope.run(() => useMapBounds(mapRef))
    expect(m.setMaxBounds).toHaveBeenCalledWith(PHILLY_MAP_BOUNDS)
    expect(m.setMinZoom).toHaveBeenCalledWith(PHILLY_MIN_ZOOM)
    scope.stop()
  })

  it('waits for the isLoaded ref to flip before applying bounds', async () => {
    const m = { setMaxBounds: vi.fn(), setMinZoom: vi.fn() }
    const loaded = ref(false)
    const mapRef = shallowRef({ map: { value: m }, isLoaded: loaded })
    const scope = effectScope()
    scope.run(() => useMapBounds(mapRef))
    expect(m.setMaxBounds).not.toHaveBeenCalled()
    loaded.value = true
    await nextTick()
    expect(m.setMaxBounds).toHaveBeenCalledWith(PHILLY_MAP_BOUNDS)
    expect(m.setMinZoom).toHaveBeenCalledWith(PHILLY_MIN_ZOOM)
    scope.stop()
  })
})

describe('useMapBounds - no component', () => {
  it('does nothing while the map ref is null', async () => {
    const m = { setMaxBounds: vi.fn(), setMinZoom: vi.fn() }
    const mapRef = shallowRef<{ map: typeof m; isLoaded: boolean } | null>(null)
    const scope = effectScope()
    scope.run(() => useMapBounds(mapRef))
    expect(m.setMaxBounds).not.toHaveBeenCalled()
    mapRef.value = { map: m, isLoaded: true }
    await nextTick()
    expect(m.setMaxBounds).toHaveBeenCalledWith(PHILLY_MAP_BOUNDS)
    expect(m.setMinZoom).toHaveBeenCalledWith(PHILLY_MIN_ZOOM)
    scope.stop()
  })
})
