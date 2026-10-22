// ABOUTME: Finder state for the reports landing — seeds city-wide data (geolocation
// ABOUTME: or default, loaded once), owns the service-type filter, and derives the
// ABOUTME: ReportLocation list the Pinboard view binds.
import { computed, onBeforeMount, ref, type ComputedRef, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useOpenIssuesStore } from '@/stores/openIssues'
import { getCurrentPosition } from '@/composables/useGeolocation'
import { reportToLocation } from '@/utils/reportCard'
import { DEFAULT_CENTER } from '@/utils/geoDefaults'
import { serviceTypeIconComponent } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'
import {
  searchLocations,
  useUserAndSearchLocations,
  type FilterProps,
  type LatLon,
} from '@pinboard/ui'
import type { ReportLocation } from '@/types/app'

export interface UseReportFinder extends Pick<
  ReturnType<typeof useUserAndSearchLocations>,
  | 'userLocationState'
  | 'locationSearchMode'
  | 'searchOrUserLocation'
  | 'handleSearchSubmit'
  | 'handleMapGeolocate'
  | 'handleMapGeolocateError'
> {
  aisClientId: string | undefined
  locations: ComputedRef<ReportLocation[]>
  filterOptions: ComputedRef<FilterProps[]>
  isLoading: Ref<boolean>
  errorMessage: ComputedRef<string | null>
  filter: Ref<string>
  init: () => Promise<void>
  setCenter: (loc: LatLon) => void
  setFilter: (value: string) => void
}

export function useReportFinder(): UseReportFinder {
  const aisClientId: string | undefined = import.meta.env.VITE_311_AIS_GATEKEEPER_KEY || undefined
  const store = useOpenIssuesStore()
  const { reports, isLoading, error } = storeToRefs(store)

  const {
    keywordsForSearch,
    userLocationState,
    locationSearchMode,
    searchOrUserLocation,
    handleSearchSubmit,
    handleMapGeolocate,
    handleMapGeolocateError,
    getLocationsWithDistance,
  } = useUserAndSearchLocations({ aisClientId })

  const filter = ref('all')

  // True once the center is a real user anchor (geolocation fix or searched
  // address) rather than the default city center; gates distance sorting.
  const hasAnchor = ref(false)

  const errorMessage = computed(() => error.value?.message ?? '')

  const reportLocations = computed<ReportLocation[]>(() => {
    return reports.value.map((report) => reportToLocation(report))
  })

  const filteredLocations = computed<ReportLocation[]>(() => {
    return filter.value === 'all'
      ? reportLocations.value
      : reportLocations.value.filter((r) => r.serviceType === filter.value)
  })

  const searchedLocations = computed<ReportLocation[]>(() => {
    return keywordsForSearch
      ? searchLocations(filteredLocations, keywordsForSearch)
      : filteredLocations.value
  })

  const locationsWithDistances = computed<ReportLocation[]>(() => {
    return hasAnchor.value
      ? getLocationsWithDistance(searchedLocations).value
      : filteredLocations.value
  })

  const locations = computed<ReportLocation[]>(() => {
    const sorted = hasAnchor.value
      ? locationsWithDistances.value.sort((a, b) => Number(a.distance) - Number(b.distance))
      : locationsWithDistances.value
    // filter sorted from keyword search results
    return sorted
  })

  const filterOptions = computed<FilterProps[]>(() => {
    return [...new Set(reportLocations.value.map((report) => report.serviceType))]
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
    searchOrUserLocation.value = loc
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

  onBeforeMount(() => {
    searchOrUserLocation.value = {
      latitude: DEFAULT_CENTER.lat,
      longitude: DEFAULT_CENTER.lng,
      accuracy: NaN,
    }
  })

  return {
    aisClientId,
    userLocationState,
    locationSearchMode,
    searchOrUserLocation,
    handleSearchSubmit,
    handleMapGeolocate,
    handleMapGeolocateError,
    locations,
    filterOptions,
    isLoading,
    errorMessage,
    filter,
    init,
    setCenter,
    setFilter,
  }
}
