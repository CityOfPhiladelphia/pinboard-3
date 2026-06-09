// ABOUTME: Finder state for the reports landing — seeds the nearby region (geolocation
// ABOUTME: or default, loaded once), owns the service-type filter, and derives the
// ABOUTME: BasicLocation list + reportById lookup the Pinboard view binds.
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import type { PinboardTypes } from '@pinboard/ui'
import { useNearbyReports, type Report } from '@/composables/useNearbyReports'
import { getCurrentPosition } from '@/composables/useGeolocation'
import { reportToLocation } from '@/utils/reportCard'

const DEFAULT_CENTER = { lat: 39.9526, lng: -75.1652 }
const DEFAULT_RADIUS = 1600

export interface UseReportFinder {
  locations: ComputedRef<PinboardTypes.BasicLocation[]>
  searchOrUserLocation: Ref<PinboardTypes.LatLon>
  isLoading: Ref<boolean>
  errorMessage: ComputedRef<string | null>
  filter: Ref<string>
  init: () => Promise<void>
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

  function reportById(id: string): Report | undefined {
    return reports.value.find((r) => r.id === id)
  }

  async function init() {
    const pos = await getCurrentPosition()
    const center = pos ?? DEFAULT_CENTER
    searchOrUserLocation.value = { latitude: center.lat, longitude: center.lng }
    await load({ lat: center.lat, lng: center.lng, radius: DEFAULT_RADIUS })
  }

  function setFilter(value: string) {
    filter.value = value
  }

  return {
    locations,
    searchOrUserLocation,
    isLoading,
    errorMessage,
    filter,
    init,
    setFilter,
    reportById,
  }
}
