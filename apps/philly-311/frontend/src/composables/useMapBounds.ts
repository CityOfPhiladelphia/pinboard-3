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

interface MapVMComponent {
  map?: { value?: { setMaxBounds: (bounds: [[number, number], [number, number]]) => void } | null }
  isLoaded?: { value?: boolean }
}

/**
 * Apply maxBounds to a phila-ui-map-core <Map> via a template ref.
 *
 *   const phila = ref<InstanceType<typeof PhilaMap> | null>(null);
 *   useMapBounds(phila);
 *   <PhilaMap ref="phila" ... />
 */
export function useMapBounds(
  mapRef: Ref<MapVMComponent | null | undefined>,
  bounds: [[number, number], [number, number]] = PHILLY_MAP_BOUNDS,
) {
  watch(
    () => {
      const c = mapRef.value
      const m = c?.map?.value ?? null
      const loaded = c?.isLoaded?.value ?? false
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
