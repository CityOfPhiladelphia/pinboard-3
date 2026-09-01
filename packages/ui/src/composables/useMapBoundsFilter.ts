import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { BasicLocation, MapBounds } from '../types'
import { isLocationInBounds } from '../utilities/isLocationInBounds'

export interface UseMapBoundsFilterOptions {
  /**
   * An id to keep in `visibleLocations` even when it falls outside the
   * current bounds. Pass the id PinboardBody currently has selected (e.g. from
   * its own `?location=` query param, via `useRoute()`) so a card the user
   * selected before panning away stays resolvable - PinboardBody's URL
   * resolution, print, and selection fallback all read from the same
   * `locations` array the card list renders, so without this a pan can strand
   * the open detail panel (e.g. hitting Back can no longer find the location).
   */
  alwaysInclude?: Ref<string | null | undefined> | ComputedRef<string | null | undefined>
}

export interface UseMapBoundsFilter<PinboardLocation> {
  /** Current map viewport, or null until one has been reported. */
  mapBounds: Ref<MapBounds | null>
  /** `locations` narrowed to `mapBounds` (plus `alwaysInclude`'s id, if set); equals `locations` until a viewport is known. */
  visibleLocations: ComputedRef<PinboardLocation[]>
  /** Wire directly to Pinboard's `@bounds-change` emit. */
  setMapBounds: (bounds: MapBounds) => void
}

/**
 * Narrows a location list to the current map viewport - the filtering half of
 * the map-synced card list pattern. Pair with PinboardBody's `@bounds-change`
 * emit, feeding the result straight back into its single `locations` prop:
 *
 *   const route = useRoute()
 *   const selectedId = computed(() => typeof route.query.location === 'string' ? route.query.location : undefined)
 *   const { visibleLocations, setMapBounds } = PinboardComposables.useMapBoundsFilter(locations, {
 *     alwaysInclude: selectedId,
 *   })
 *   <Pinboard :locations="visibleLocations" @bounds-change="setMapBounds" />
 *
 * Keep a separate, unfiltered locations source for anything that must show
 * every location regardless of viewport (e.g. map markers - MapLibre already
 * only draws what's on-screen, so markers shouldn't be pre-filtered by this).
 */
export function useMapBoundsFilter<PinboardLocation extends BasicLocation>(
  locations: Ref<PinboardLocation[]> | ComputedRef<PinboardLocation[]>,
  options?: UseMapBoundsFilterOptions
): UseMapBoundsFilter<PinboardLocation> {
  const mapBounds = ref<MapBounds | null>(null)

  const visibleLocations = computed<PinboardLocation[]>(() => {
    const bounds = mapBounds.value
    if (!bounds) return locations.value

    const inBounds = locations.value.filter((loc) => isLocationInBounds(loc, bounds))

    const keepId = options?.alwaysInclude?.value
    if (keepId && !inBounds.some((loc) => loc.id === keepId)) {
      const kept = locations.value.find((loc) => loc.id === keepId)
      if (kept) return [...inBounds, kept]
    }
    return inBounds
  })

  function setMapBounds(bounds: MapBounds) {
    mapBounds.value = bounds
  }

  return { mapBounds, visibleLocations, setMapBounds }
}
