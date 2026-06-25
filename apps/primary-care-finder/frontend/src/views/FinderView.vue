<script setup lang="ts">
import { computed, ref, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PinboardBody,
  CircleLayer,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
  PinboardComposables,
  PinboardUtilities,
  Callout,
} from '@pinboard/ui'
import type { FilterValues, PinboardTypes } from '@pinboard/ui'
import { useLocations } from '@/composables/useLocations'
import { useFilterChipDefinitions } from '@/composables/filters/useFilterChipDefinitions.ts'
import { useFilterLogic } from '@/composables/filters/useFilterLogic'
import {
  filterKeys,
  visitTypeOptions,
  specialtyOptions,
  testsOptions,
} from '@/composables/filters/filterKeysValues'
import LocationCard from '@/components/LocationCard.vue'
import LocationDetail from '@/components/LocationDetail.vue'
import type {
  AgeGroupFilter,
  LanguagesFilter,
  PrimaryCareFilterValues,
  PrimaryCareLocation,
  PrimaryCareResponse,
  SpecialtyFilter,
  TestsFilter,
  VisitTypeFilter,
  WaitTimeFilter,
} from '@/types'

const isMobile = PinboardComposables.useIsMobile()
const { t } = useI18n()
const { filterChipDefinitions } = useFilterChipDefinitions()

const emptyFilters: PrimaryCareFilterValues = {
  sort: '',
  ageGroup: [],
  waitTime: [],
  visitType: [],
  specialty: [],
  tests: [],
  languages: [],
}

const searchPlaceholderText = computed(() => t('searchPlaceholder'))

// The left-panel callout starts expanded on load; the user can still collapse it.
const calloutOpen = ref(true)

const { locations, isLoading, errorMessage, geojson } = useLocations()
// Location is requested only when the user clicks the geolocation button, which
// emits to handleGeolocate. The shared useUserLocation composable prompts on load,
// which the primary care finder intentionally avoids.
const userLocation = ref<PinboardTypes.LatLon>({
  latitude: NaN,
  longitude: NaN,
})
const searchString = ref('')

const filterState = ref<PrimaryCareFilterValues>(emptyFilters)

const VISIT_TYPE_SET = new Set<string>(Object.values(visitTypeOptions))
const SPECIALTY_SET = new Set<string>(Object.values(specialtyOptions))
const TESTS_SET = new Set<string>(Object.values(testsOptions))

function activeKeys(map: boolean | Record<string, boolean> | undefined): string[] {
  if (!map || typeof map !== 'object') return []
  return Object.entries(map).filter(([, v]) => v).map(([k]) => k)
}

function toMap(arr: string[]): Record<string, boolean> {
  return Object.fromEntries(arr.map((v) => [v, true]))
}

const filterValuesForProp = computed<FilterValues>(() => ({
  [filterKeys.ageGroup]: toMap(filterState.value.ageGroup),
  [filterKeys.waitTime]: toMap(filterState.value.waitTime),
  [filterKeys.visitType]: toMap([
    ...filterState.value.visitType,
    ...filterState.value.specialty,
    ...filterState.value.tests,
  ]),
  [filterKeys.languages]: toMap(filterState.value.languages),
}))

const { filterLogicalValue } = useFilterLogic(locations, filterState)

const locationsWithDistance = computed<PrimaryCareLocation[]>(() => {
  const { latitude, longitude } = userLocation.value
  return locations.value.map((loc) => ({
    ...loc,
    locationCardInfo: {
      ...loc.locationCardInfo,
      subheader: PinboardUtilities.hasLocationData(userLocation.value)
        ? `${PinboardUtilities.getHaversineDistance(
            { latitude: loc.latitude, longitude: loc.longitude },
            { latitude, longitude },
            1
          )} mi`
        : undefined,
    },
  }))
})

const filteredGeojson = computed<PrimaryCareResponse | undefined>(() => {
  if (geojson.value?.features) {
    let result = filterLogicalValue.value.length
      ? applyFilters(geojson.value.features)
      : geojson.value.features

    if (searchString.value) {
      const terms = searchString.value.replace(/\W+/g, ' ').toLowerCase().split(' ').filter(Boolean)
      result = result.filter((loc) => {
        const haystack = JSON.stringify(Object.values(loc)).toLowerCase()
        return terms.some((term) => haystack.includes(term))
      })
    }

    return {
      type: 'FeatureCollection',
      features: result,
    }
  }
  return undefined
})

const filteredLocations = computed<PrimaryCareLocation[]>(() => {
  let result = filterLogicalValue.value.length
    ? applyFilters(locationsWithDistance.value)
    : locationsWithDistance.value

  if (searchString.value) {
    const terms = searchString.value.replace(/\W+/g, ' ').toLowerCase().split(' ').filter(Boolean)
    result = result.filter((loc) => {
      const haystack = JSON.stringify(Object.values(loc)).toLowerCase()
      return terms.some((term) => haystack.includes(term))
    })
  }

  return result
})

function applyFilters<T>(arr: T[]): T[] {
  const filtered: T[] = []
  let check = 1
  let offset = 0
  arr.forEach((item) => {
    if (check & filterLogicalValue.value[offset]) {
      filtered.push(item)
    }
    check <<= 1
    if (!(check & 0xffffffff)) {
      check = 1
      offset++
    }
  })
  return filtered
}

function handleSearchSubmit(s: string) {
  searchString.value = s
}

function handleGeolocate(locationData: { latitude: number; longitude: number; accuracy: number }) {
  console.log('Geolocation Accuracy: ', locationData.accuracy)
  userLocation.value = {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
  }
}

function handleGeolocateError(error: Error | GeolocationPositionError) {
  console.error(error)
}

function handleApplyFilter(values: FilterValues) {
  const allVisitType = activeKeys(values[filterKeys.visitType])
  filterState.value = {
    sort: filterState.value.sort,
    ageGroup: activeKeys(values[filterKeys.ageGroup]) as AgeGroupFilter[],
    waitTime: activeKeys(values[filterKeys.waitTime]) as WaitTimeFilter[],
    visitType: allVisitType.filter((v) => VISIT_TYPE_SET.has(v)) as VisitTypeFilter[],
    specialty: allVisitType.filter((v) => SPECIALTY_SET.has(v)) as SpecialtyFilter[],
    tests: allVisitType.filter((v) => TESTS_SET.has(v)) as TestsFilter[],
    languages: activeKeys(values[filterKeys.languages]) as LanguagesFilter[],
  }
}

function asPrimaryCareLocation(location: PinboardTypes.BasicLocation) {
  return location as PrimaryCareLocation
}
</script>

<template>
  <PinboardBody
    :filter-values="filterValuesForProp"
    :locations="filteredLocations"
    :search-or-user-location="userLocation"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :location-panel-search="searchPlaceholderText"
    :geojson="filteredGeojson"
    :is-mobile="isMobile"
    :filters="filterChipDefinitions"
    @search="handleSearchSubmit"
    @update:filter-values="handleApplyFilter"
  >
    <template #locations-header>
      <div v-if="!isMobile" class="locations-callout">
        <Callout v-model:open="calloutOpen" type="info" :title="t('callout.title')">
          {{ t('callout.message') }}
          <RouterLink to="/info">{{ t('callout.linkText') }}</RouterLink>
        </Callout>
      </div>
    </template>

    <template #location-card="{ location }">
      <LocationCard :location="asPrimaryCareLocation(location)" />
    </template>

    <template #location-detail="{ location, onClose }">
      <LocationDetail :location="asPrimaryCareLocation(location)" :on-close="onClose" />
    </template>

    <template
      #map-content="{ hoveredId, selectedId, mobileControlsTarget, onHover, onHoverEnd, onSelect }"
    >
      <MapNavigationControl v-if="!isMobile" position="bottom-right" />
      <BasemapToggle
        position="top-right"
        :teleport-to="isMobile ? mobileControlsTarget : undefined"
      />
      <GeolocationButton
        :position="isMobile ? 'top-right' : 'bottom-right'"
        :teleport-to="isMobile ? mobileControlsTarget : undefined"
        @located="handleGeolocate"
        @error="handleGeolocateError"
      />

      <CircleLayer
        v-if="filteredGeojson"
        id="locations"
        :source="{ type: 'geojson', data: toRaw(filteredGeojson) as any }"
        :paint="{
          'circle-radius': [
            'case',
            ['==', ['get', 'id'], selectedId ?? ''],
            12,
            ['==', ['get', 'id'], hoveredId ?? ''],
            10,
            7,
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'id'], selectedId ?? ''],
            '#0D47A1',
            ['==', ['get', 'id'], hoveredId ?? ''],
            '#1976D2',
            '#1976D2',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        }"
        @mouseenter="(e: any) => onHover(e.features?.[0]?.properties?.id)"
        @mouseleave="onHoverEnd"
        @click="
          (e: any) => {
            const feature = e.features?.[0]
            if (!feature) return
            const loc = locationsWithDistance.find((l) => l.id === feature.properties?.id)
            if (loc) onSelect(loc)
          }
        "
      />
    </template>
  </PinboardBody>
</template>

<style scoped>
.locations-callout {
  padding: 1.5rem 1rem 0 1rem;
}

.locations-callout :deep(.callout-title) {
  font-size: var(--scale-200);
  text-align: left;
}
</style>
