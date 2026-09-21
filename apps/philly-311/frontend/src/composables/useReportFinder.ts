// ABOUTME: Finder state for the reports landing — seeds city-wide data (geolocation
// ABOUTME: or default, loaded once), owns the service-type filter, and derives the
// ABOUTME: BasicLocation list + reportById lookup the Pinboard view binds.
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { PinboardTypes } from '@pinboard/ui'
import type { Report } from '@/composables/useNearbyReports'
import { useOpenIssuesStore } from '@/stores/openIssues'
import { getCurrentPosition } from '@/composables/useGeolocation'
import { reportToLocation } from '@/utils/reportCard'
import { DEFAULT_CENTER } from '@/utils/geoDefaults'
import type { Service } from '@/types/app'

export interface UseReportFinder {
  locations: ComputedRef<PinboardTypes.BasicLocation[]>
  filterOptions: ComputedRef<{ value: Service; label: Service }[]>
  searchOrUserLocation: Ref<PinboardTypes.LatLon>
  isLoading: Ref<boolean>
  errorMessage: ComputedRef<string | null>
  filter: Ref<string>
  init: () => Promise<void>
  setCenter: (loc: PinboardTypes.LatLon) => void
  setFilter: (value: string) => void
  reportById: (id: string) => Report | undefined
}

export function useReportFinder(): UseReportFinder {
  const store = useOpenIssuesStore()
  const { reports, isLoading, error, byId } = storeToRefs(store)

  const filter = ref('all')

  const searchOrUserLocation = ref<PinboardTypes.LatLon>({
    latitude: DEFAULT_CENTER.lat,
    longitude: DEFAULT_CENTER.lng,
  })
  // True once the center is a real user anchor (geolocation fix or searched
  // address) rather than the default city center; gates distance sorting.
  const hasAnchor = ref(false)

  const errorMessage = computed(() => error.value?.message ?? null)

  // Ranking-only squared distance: equirectangular approximation is monotonic
  // with great-circle distance at city scale, so ordering is exact for Philly.
  function rankingDistance(loc: PinboardTypes.BasicLocation, from: PinboardTypes.LatLon): number {
    const dLat = loc.latitude - from.latitude
    const dLng = (loc.longitude - from.longitude) * Math.cos(from.latitude * (Math.PI / 180))
    return dLat * dLat + dLng * dLng
  }

  const locations = computed<PinboardTypes.BasicLocation[]>(() => {
    const list =
      filter.value === 'all'
        ? reports.value
        : reports.value.filter((r) => r.serviceType === filter.value)

    const mapped = list.map(reportToLocation)
    if (!hasAnchor.value) return mapped

    const from = searchOrUserLocation.value
    return mapped.sort((a, b) => rankingDistance(a, from) - rankingDistance(b, from))
  })

  const filterOptions = computed(() => {
    const counts = new Map<Service, number>()
    for (const r of reports.value) {
      if (!r.serviceType) continue
      counts.set(r.serviceType, (counts.get(r.serviceType) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([serviceType]) => ({ value: serviceType, label: serviceType }))
  })

  function reportById(id: string): Report | undefined {
    return byId.value.get(id)
  }

  function setCenter(loc: PinboardTypes.LatLon): void {
    searchOrUserLocation.value = { latitude: loc.latitude, longitude: loc.longitude }
    hasAnchor.value = true
  }

  async function init(): Promise<void> {
    const pos = await getCurrentPosition()
    const center = pos ?? DEFAULT_CENTER
    searchOrUserLocation.value = { latitude: center.lat, longitude: center.lng }
    hasAnchor.value = pos !== null
    await store.ensureLoaded({ lat: center.lat, lng: center.lng })
  }

  function setFilter(value: string) {
    filter.value = value
  }

  return {
    locations,
    filterOptions,
    searchOrUserLocation,
    isLoading,
    errorMessage,
    filter,
    init,
    setCenter,
    setFilter,
    reportById,
  }
}
