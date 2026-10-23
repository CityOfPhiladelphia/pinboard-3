// ABOUTME: Finder state for the reports landing — seeds city-wide data (geolocation
// ABOUTME: or default, loaded once), owns the service-type filter, and derives the
// ABOUTME: ReportLocation list the Pinboard view binds.
import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useOpenIssuesStore } from '@/stores/openIssues'
import { reportToLocation } from '@/utils/reportCard'
import { DEFAULT_CENTER } from '@/utils/geoDefaults'
import { serviceTypeIconComponent } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'
import {
  hasLocationData,
  searchLocations,
  useMapBoundsFilter,
  useUserAndSearchLocations,
  type FilterProps,
  type MapBounds,
} from '@pinboard/ui'
import type { ReportLocation } from '@/types/app'
import { useRoute } from 'vue-router'

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
  setFilter: (value: string) => void
  setMapBounds: (bounds: MapBounds) => void
}

export function useReportFinder(): UseReportFinder {
  const aisClientId: string | undefined = import.meta.env.VITE_311_AIS_GATEKEEPER_KEY || undefined
  const store = useOpenIssuesStore()
  const { reports, error } = storeToRefs(store)
  const {
    keywordsForSearch,
    userLocationState,
    locationSearchMode,
    searchOrUserLocation,
    handleSearchSubmit,
    handleMapGeolocate,
    handleMapGeolocateError,
    getLocationsWithDistance,
    getUserLocation,
  } = useUserAndSearchLocations({ aisClientId, timeout: 10_000 })

  const filter = ref('all')

  const route = useRoute()
  const selectedReportId = computed(() =>
    typeof route.query.location === 'string' ? route.query.location : undefined,
  )

  const isLoading = computed(() => {
    return store.isLoading || userLocationState.value === 'acquiring'
  })

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

  const locationsWithDist = computed<ReportLocation[]>(() => {
    return hasLocationData(searchOrUserLocation)
      ? getLocationsWithDistance(filteredLocations).sort(
          (a, b) => Number(a.distance) - Number(b.distance),
        )
      : searchedLocations.value
  })

  const { visibleLocations, setMapBounds } = useMapBoundsFilter(locationsWithDist, {
    alwaysInclude: selectedReportId,
  })

  const locations = computed(() => [
    ...new Set([...searchedLocations.value, ...visibleLocations.value]),
  ])

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

  async function init(): Promise<void> {
    await getUserLocation()
    await store.ensureLoaded(
      hasLocationData(searchOrUserLocation) ? searchOrUserLocation.value : DEFAULT_CENTER,
    )
  }

  function setFilter(value: string) {
    filter.value = value
  }

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
    setFilter,
    setMapBounds,
  }
}
