import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useMapBoundsFilter } from './useMapBoundsFilter'
import type { BasicLocation } from '../types'

function locations(): BasicLocation[] {
  return [
    { id: 'a', name: 'A', latitude: 39.95, longitude: -75.15 },
    { id: 'b', name: 'B', latitude: 40.05, longitude: -75.15 },
  ]
}

describe('useMapBoundsFilter', () => {
  it('equals the source locations until a bounds is reported', () => {
    const { visibleLocations } = useMapBoundsFilter(ref(locations()))
    expect(visibleLocations.value.map((l) => l.id)).toEqual(['a', 'b'])
  })

  it('narrows to locations within the reported bounds', () => {
    const { visibleLocations, setMapBounds } = useMapBoundsFilter(ref(locations()))
    setMapBounds({ west: -75.2, south: 39.9, east: -75.1, north: 40.0 })
    expect(visibleLocations.value.map((l) => l.id)).toEqual(['a'])
  })

  it('re-derives when a later setMapBounds call widens the viewport', () => {
    const { visibleLocations, setMapBounds } = useMapBoundsFilter(ref(locations()))
    setMapBounds({ west: -75.2, south: 39.9, east: -75.1, north: 40.0 })
    expect(visibleLocations.value).toHaveLength(1)
    setMapBounds({ west: -75.2, south: 39.9, east: -75.1, north: 40.1 })
    expect(visibleLocations.value.map((l) => l.id)).toEqual(['a', 'b'])
  })

  it('tracks the source ref, not a snapshot taken at setup', () => {
    const source = ref(locations())
    const { visibleLocations } = useMapBoundsFilter(source)
    source.value = [...locations(), { id: 'c', name: 'C', latitude: 39.96, longitude: -75.16 }]
    expect(visibleLocations.value.map((l) => l.id)).toEqual(['a', 'b', 'c'])
  })

  it('exposes the current bounds via mapBounds', () => {
    const { mapBounds, setMapBounds } = useMapBoundsFilter(ref(locations()))
    expect(mapBounds.value).toBeNull()
    const bounds = { west: -75.2, south: 39.9, east: -75.1, north: 40.0 }
    setMapBounds(bounds)
    expect(mapBounds.value).toEqual(bounds)
  })

  describe('alwaysInclude', () => {
    const bounds = { west: -75.2, south: 39.9, east: -75.1, north: 40.0 } // b (40.05) is outside

    it('keeps an out-of-bounds id in the result', () => {
      const alwaysInclude = ref<string | undefined>('b')
      const { visibleLocations, setMapBounds } = useMapBoundsFilter(ref(locations()), {
        alwaysInclude,
      })
      setMapBounds(bounds)
      expect(visibleLocations.value.map((l) => l.id)).toEqual(['a', 'b'])
    })

    it('does not duplicate an id already within bounds', () => {
      const alwaysInclude = ref<string | undefined>('a')
      const { visibleLocations, setMapBounds } = useMapBoundsFilter(ref(locations()), {
        alwaysInclude,
      })
      setMapBounds(bounds)
      expect(visibleLocations.value.map((l) => l.id)).toEqual(['a'])
    })

    it('has no effect when unset', () => {
      const { visibleLocations, setMapBounds } = useMapBoundsFilter(ref(locations()))
      setMapBounds(bounds)
      expect(visibleLocations.value.map((l) => l.id)).toEqual(['a'])
    })

    it('has no effect when the id does not exist in the source list', () => {
      const alwaysInclude = ref<string | undefined>('nonexistent')
      const { visibleLocations, setMapBounds } = useMapBoundsFilter(ref(locations()), {
        alwaysInclude,
      })
      setMapBounds(bounds)
      expect(visibleLocations.value.map((l) => l.id)).toEqual(['a'])
    })

    it('re-derives as alwaysInclude changes', () => {
      const alwaysInclude = ref<string | undefined>(undefined)
      const { visibleLocations, setMapBounds } = useMapBoundsFilter(ref(locations()), {
        alwaysInclude,
      })
      setMapBounds(bounds)
      expect(visibleLocations.value.map((l) => l.id)).toEqual(['a'])
      alwaysInclude.value = 'b'
      expect(visibleLocations.value.map((l) => l.id)).toEqual(['a', 'b'])
      alwaysInclude.value = undefined
      expect(visibleLocations.value.map((l) => l.id)).toEqual(['a'])
    })
  })
})
