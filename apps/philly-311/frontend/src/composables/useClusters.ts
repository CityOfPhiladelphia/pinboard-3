// ABOUTME: Supercluster-backed composable that bins BasicLocation points into
// ABOUTME: cluster/single items at the current zoom level, with throttled re-indexing.
import { ref, computed, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import Supercluster from 'supercluster'
import type { PinboardTypes } from '@pinboard/ui'

export type ClusterItem =
  | { type: 'cluster'; id: number; lng: number; lat: number; count: number }
  | { type: 'single'; id: string; lng: number; lat: number }

type PointProperties = { id: string }

function toFeature(loc: PinboardTypes.BasicLocation): Supercluster.PointFeature<PointProperties> {
  return {
    type: 'Feature',
    properties: { id: loc.id },
    geometry: { type: 'Point', coordinates: [loc.longitude, loc.latitude] },
  }
}

export function useClusters(
  points: Ref<PinboardTypes.BasicLocation[]>,
  zoom: Ref<number>,
): { clusters: ComputedRef<ClusterItem[]>; expansionZoom: (clusterId: number) => number } {
  const index = new Supercluster<PointProperties>({ radius: 60, maxZoom: 16 })
  const indexVersion = ref(0)

  // Throttled re-index: leading + trailing, 400 ms window.
  let throttleTimer: ReturnType<typeof setTimeout> | null = null
  let pendingLoad = false

  function doLoad() {
    index.load(points.value.map(toFeature))
    indexVersion.value++
    throttleTimer = null
    if (pendingLoad) {
      pendingLoad = false
      scheduleLoad()
    }
  }

  function scheduleLoad() {
    if (throttleTimer === null) {
      // Leading edge: fire immediately.
      doLoad()
      // Block further leading-edge calls for 400 ms.
      throttleTimer = setTimeout(() => {
        throttleTimer = null
        if (pendingLoad) {
          pendingLoad = false
          doLoad()
        }
      }, 400)
    } else {
      // Within the window: mark trailing rebuild needed.
      pendingLoad = true
    }
  }

  // Seed index with initial points synchronously so the computed isn't empty.
  index.load(points.value.map(toFeature))

  watch(points, scheduleLoad)

  const clusters = computed<ClusterItem[]>(() => {
    // Reading indexVersion makes this computed re-run when the index rebuilds.
    void indexVersion.value

    const z = Math.round(zoom.value)
    const raw = index.getClusters([-180, -85, 180, 85], z)

    return raw.map((f) => {
      const [lng, lat] = f.geometry.coordinates
      if ('cluster' in f.properties && f.properties.cluster) {
        const cp = f.properties as Supercluster.ClusterProperties
        return { type: 'cluster' as const, id: cp.cluster_id, lng, lat, count: cp.point_count }
      }
      const pp = f.properties as PointProperties
      return { type: 'single' as const, id: pp.id, lng, lat }
    })
  })

  function expansionZoom(clusterId: number): number {
    return index.getClusterExpansionZoom(clusterId)
  }

  return { clusters, expansionZoom }
}
