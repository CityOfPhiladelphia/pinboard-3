// ABOUTME: Finder state for the reports landing — seeds city-wide data (geolocation
// ABOUTME: or default, loaded once), owns the service-type filter, and derives the
// ABOUTME: ReportLocation list the Pinboard view binds.
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { FilterProps, LatLon } from '@pinboard/ui'
import { useOpenIssuesStore } from '@/stores/openIssues'
import { getCurrentPosition } from '@/composables/useGeolocation'
import { calcLocationDistance, reportToLocation } from '@/utils/reportCard'
import { DEFAULT_CENTER } from '@/utils/geoDefaults'
import { serviceTypeIconComponent } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'
import type { ReportLocation } from '@/types/app'

export interface UseReportFinder {
  locations: ComputedRef<ReportLocation[]>
  filterOptions: ComputedRef<FilterProps[]>
  searchOrUserLocation: Ref<LatLon>
  isLoading: Ref<boolean>
  errorMessage: ComputedRef<string | null>
  filter: Ref<string>
  init: () => Promise<void>
  setCenter: (loc: LatLon) => void
  setFilter: (value: string) => void
}

export function useReportFinder(): UseReportFinder {
  const store = useOpenIssuesStore()
  const { reports, isLoading, error } = storeToRefs(store)

  const filter = ref('all')

  const searchOrUserLocation = ref<LatLon>({
    latitude: DEFAULT_CENTER.lat,
    longitude: DEFAULT_CENTER.lng,
  })
  // True once the center is a real user anchor (geolocation fix or searched
  // address) rather than the default city center; gates distance sorting.
  const hasAnchor = ref(false)

  const errorMessage = computed(() => error.value?.message ?? '')

  const reportLocations = computed<ReportLocation[]>(() => {
    console.log(reports.value)
    return reports.value.map((report) => reportToLocation(report))
  })

  const locationsDistances = computed<ReportLocation[]>(() => {
    if (!hasAnchor.value) return reportLocations.value
    return calcLocationDistance(reportLocations, searchOrUserLocation.value).value.sort(
      (a, b) => Number(a.distance) - Number(b.distance),
    )
  })

  const locations = computed<ReportLocation[]>(() => {
    const list =
      filter.value === 'all'
        ? locationsDistances.value
        : locationsDistances.value.filter((r) => r.serviceType === filter.value)

    if (!hasAnchor.value) return list
    return list.sort((a, b) => Number(a.distance) - Number(b.distance))
  })

  const filterOptions = computed<FilterProps[]>(() => {
    return [...new Set(reports.value.map((report) => report.serviceType))]
      .filter(Boolean)
      .sort()
      .map((serviceType) => ({
        name: serviceType,
        label: serviceType,
        icon: serviceTypeIconComponent(serviceType),
        iconColor: serviceTypeColor(serviceType),
      }))
  })

  function setCenter(loc: LatLon): void {
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
  }
}
