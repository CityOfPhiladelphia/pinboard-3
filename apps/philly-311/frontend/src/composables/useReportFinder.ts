// ABOUTME: Finder state for the reports landing — seeds the nearby region (geolocation
// ABOUTME: or default, loaded once), owns the service-type filter, and derives the
// ABOUTME: BasicLocation list + reportById lookup the Pinboard view binds.
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { PinboardTypes } from '@pinboard/ui'
import { useNearbyReports, type Report } from '@/composables/useNearbyReports'
import { getCurrentPosition } from '@/composables/useGeolocation'
import { reportToLocation } from '@/utils/reportCard'
import { DEFAULT_CENTER, DEFAULT_RADIUS } from '@/utils/geoDefaults'

export interface UseReportFinder {
  locations: ComputedRef<PinboardTypes.BasicLocation[]>
  filterOptions: ComputedRef<{ value: string; label: string }[]>
  searchOrUserLocation: Ref<PinboardTypes.LatLon>
  isLoading: Ref<boolean>
  errorMessage: ComputedRef<string | null>
  filter: Ref<string>
  init: () => Promise<void>
  setCenter: (loc: PinboardTypes.LatLon) => Promise<void>
  setFilter: (value: string) => void
  reportById: (id: string) => Report | undefined
}

export function useReportFinder(): UseReportFinder {
  const { reports, isLoading, error, load } = useNearbyReports()

  const filter = ref('all')

  const searchOrUserLocation = ref<PinboardTypes.LatLon>({
    latitude: DEFAULT_CENTER.lat,
    longitude: DEFAULT_CENTER.lng,
  })

  const errorMessage = computed(() => error.value?.message ?? null)

  const locations = computed<PinboardTypes.BasicLocation[]>(() => {
    const list =
      filter.value === 'all'
        ? reports.value
        : reports.value.filter((r) => r.serviceType === filter.value)

    return list.map(reportToLocation)
  })

  const filterOptions = computed<{ value: string; label: string }[]>(() => {
    const counts = new Map<string, number>()
    for (const r of reports.value) {
      counts.set(r.serviceType, (counts.get(r.serviceType) ?? 0) + 1)
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([serviceType]) => ({ value: serviceType, label: serviceType }))
  })

  function reportById(id: string): Report | undefined {
    return reports.value.find((r) => r.id === id)
  }

  async function setCenter(loc: PinboardTypes.LatLon) {
    searchOrUserLocation.value = { latitude: loc.latitude, longitude: loc.longitude }
    await load({ lat: loc.latitude, lng: loc.longitude, radius: DEFAULT_RADIUS })
  }

  async function init() {
    const pos = await getCurrentPosition()
    const center = pos ?? DEFAULT_CENTER
    await setCenter({ latitude: center.lat, longitude: center.lng })
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
