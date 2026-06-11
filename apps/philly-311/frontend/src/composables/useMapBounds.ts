// ABOUTME: After a phila-ui-map-core <Map> mounts, set maxBounds on the
// ABOUTME: underlying maplibre instance so the viewport stays inside the
// ABOUTME: CityBasemap's cached region (Philly + adjacent area). Keeps the
// ABOUTME: user from panning into 404 territory.

import type { Ref } from 'vue'
import { watch } from 'vue'

/**
 * Slight padding around Philly proper. The CityBasemap cache covers roughly
 * this footprint; outside it we get 404s on tiles. Wide enough that the
 * draggable pin and the home-page nearby map both feel free to roam.
 */
export const PHILLY_MAP_BOUNDS: [[number, number], [number, number]] = [
  [-75.32, 39.83], // SW corner [lng, lat]
  [-74.92, 40.16], // NE corner [lng, lat]
]

interface MaplibreBounded {
  setMaxBounds: (bounds: [[number, number], [number, number]]) => void
}

/**
 * The <Map> component's exposed state as seen through a template ref. Vue
 * auto-unwraps refs accessed through a child's expose() proxy, so `map` and
 * `isLoaded` normally arrive unwrapped; the raw `{ value }` shape is admitted
 * for callers that hold the refs directly.
 */
export interface MapVMComponent {
  map?: MaplibreBounded | { value?: MaplibreBounded | null } | null
  isLoaded?: boolean | { value?: boolean }
}

/**
 * Read a value a child component exposed through a template ref, whether it
 * arrives auto-unwrapped (expose proxy) or as a raw `{ value }` ref. Reading
 * `.value` here keeps reactive tracking intact for the raw-ref shape.
 */
export function readExposed<T>(v: unknown): T | null {
  if (v && typeof v === 'object' && 'value' in v) {
    return (v as { value?: T }).value ?? null
  }
  return (v as T | null | undefined) ?? null
}

/**
 * Apply maxBounds to a phila-ui-map-core <Map> via a template ref.
 *
 *   const phila = ref<InstanceType<typeof PhilaMap> | null>(null);
 *   useMapBounds(phila);
 *   <PhilaMap ref="phila" ... />
 */
export function useMapBounds<T extends MapVMComponent | null | undefined>(
  mapRef: Ref<T>,
  bounds: [[number, number], [number, number]] = PHILLY_MAP_BOUNDS,
) {
  watch(
    () => {
      const c = mapRef.value
      const m = readExposed<MaplibreBounded>(c?.map)
      const loaded = readExposed<boolean>(c?.isLoaded) ?? false
      return { m, loaded }
    },
    ({ m, loaded }) => {
      if (m && loaded) {
        m.setMaxBounds(bounds)
      }
    },
    { immediate: true },
  )
}
