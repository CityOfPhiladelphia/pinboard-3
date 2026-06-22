<script setup lang="ts">
import { computed, ref, toValue, watchEffect } from 'vue'
import {
  PinboardBody,
  PinboardShell,
  CircleLayer,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
  PinboardComposables,
  PinboardUtilities,
  FilterChoiceBitfieldGroup,
  FilterSet,
} from '@pinboard/ui'
import type { FilterValues, PinboardTypes } from '@pinboard/ui'
import { useLocations } from './composables/useLocations'
import { LocationCard, LocationDetail } from './components/_index.ts'
import { filterDefinitions } from './configs/filterChipDefinitions.ts'
import {
  waitTimeFilterParams,
  visitTypeFilterParams,
  specialtyFilterParams,
  testsFilterParams,
  languageFilterParams,
  optionNames,
} from './configs/filterLogicParams.ts'
import type { PrimaryCareFilterValues, PrimaryCareLocation } from './types'

const searchPlaceholderText = 'Search by address or keyword...'
const emptyFilters: PrimaryCareFilterValues = {
        sort: '',
        ageGroup: [],
        waitTime: [],
        visitType: [],
        specialty: [],
        tests: [],
        languages: [],
      }

const isMobile = PinboardComposables.useIsMobile()
const { locations, isLoading, errorMessage, geojson } = useLocations()
// Location is requested only when the user clicks the geolocation button, which
// emits to handleGeolocate. The shared useUserLocation composable prompts on load,
// which the primary care finder intentionally avoids.
const userLocation = ref<PinboardTypes.LatLon>({
  latitude: NaN,
  longitude: NaN,
})

const searchString = ref('')

const filterValues = ref<PrimaryCareFilterValues>(emptyFilters)

const filterBitfields = computed(() => {
  const commonParams = {
    data: locations.value,
    bufferLength: Math.ceil(locations.value.length / 32),
  }
  const waitTimeFilter = new FilterChoiceBitfieldGroup({
    ...commonParams,
    ...waitTimeFilterParams,
  })

  const visitTypeFilter = new FilterChoiceBitfieldGroup({
    ...commonParams,
    ...visitTypeFilterParams,
  })

  const specialtyFilter = new FilterChoiceBitfieldGroup({
    ...commonParams,
    ...specialtyFilterParams,
  })

  const testsFilter = new FilterChoiceBitfieldGroup({
    ...commonParams,
    ...testsFilterParams,
  })

  const languageFilter = new FilterChoiceBitfieldGroup({
    ...commonParams,
    ...languageFilterParams,
  })

  return new FilterSet({
    operation: '&',
    bufferLength: commonParams.bufferLength,
    childFilters: {
      [filterDefinitions[2].key]: waitTimeFilter,
      [filterDefinitions[3].key]: visitTypeFilter,
      [filterDefinitions[4].key]: specialtyFilter,
      [filterDefinitions[5].key]: testsFilter,
      [filterDefinitions[6].key]: languageFilter,
    },
  })
})

watchEffect(() => {
  console.log(filterBitfields.value.childFilters[filterDefinitions[2].key])
  // wait time
  filterBitfields.value.childFilters[filterDefinitions[2].key].childFilters[
    optionNames.sameDay
  ].setChecked(filterValues.value.waitTime.includes(optionNames.sameDay))
  filterBitfields.value.childFilters[filterDefinitions[2].key].childFilters[
    optionNames.weekWell
  ].setChecked(filterValues.value.waitTime.includes(optionNames.weekWell))
  filterBitfields.value.childFilters[filterDefinitions[2].key].childFilters[
    optionNames.weekSick
  ].setChecked(filterValues.value.waitTime.includes(optionNames.weekSick))
  filterBitfields.value.childFilters[filterDefinitions[2].key].childFilters[
    optionNames.twoMonths
  ].setChecked(filterValues.value.waitTime.includes(optionNames.twoMonths))

  // visit type
  filterBitfields.value.childFilters[filterDefinitions[3].key].childFilters[
    optionNames.primaryWell
  ].setChecked(filterValues.value.visitType.includes(optionNames.primaryWell))
  filterBitfields.value.childFilters[filterDefinitions[3].key].childFilters[
    optionNames.primarySick
  ].setChecked(filterValues.value.visitType.includes(optionNames.primarySick))
  filterBitfields.value.childFilters[filterDefinitions[3].key].childFilters[
    optionNames.primarySports
  ].setChecked(filterValues.value.visitType.includes(optionNames.primarySports))
  filterBitfields.value.childFilters[filterDefinitions[3].key].childFilters[
    optionNames.primaryPrenatal
  ].setChecked(filterValues.value.visitType.includes(optionNames.primaryPrenatal))
  filterBitfields.value.childFilters[filterDefinitions[3].key].childFilters[
    optionNames.primaryWomen
  ].setChecked(filterValues.value.visitType.includes(optionNames.primaryWomen))
  filterBitfields.value.childFilters[filterDefinitions[3].key].childFilters[
    optionNames.primaryTelehealth
  ].setChecked(filterValues.value.visitType.includes(optionNames.primaryTelehealth))
  filterBitfields.value.childFilters[filterDefinitions[3].key].childFilters[
    optionNames.primaryVaccines
  ].setChecked(filterValues.value.visitType.includes(optionNames.primaryVaccines))

  // specialty
  filterBitfields.value.childFilters[filterDefinitions[4].key].childFilters[
    optionNames.mental
  ].setChecked(filterValues.value.specialty.includes(optionNames.mental))
  filterBitfields.value.childFilters[filterDefinitions[4].key].childFilters[
    optionNames.dental
  ].setChecked(filterValues.value.specialty.includes(optionNames.dental))
  filterBitfields.value.childFilters[filterDefinitions[4].key].childFilters[
    optionNames.eye
  ].setChecked(filterValues.value.specialty.includes(optionNames.eye))
  filterBitfields.value.childFilters[filterDefinitions[4].key].childFilters[
    optionNames.podiatry
  ].setChecked(filterValues.value.specialty.includes(optionNames.podiatry))
  filterBitfields.value.childFilters[filterDefinitions[4].key].childFilters[
    optionNames.mat
  ].setChecked(filterValues.value.specialty.includes(optionNames.mat))
  filterBitfields.value.childFilters[filterDefinitions[4].key].childFilters[
    optionNames.nutrition
  ].setChecked(filterValues.value.specialty.includes(optionNames.nutrition))
  filterBitfields.value.childFilters[filterDefinitions[4].key].childFilters[
    optionNames.tobacco
  ].setChecked(filterValues.value.specialty.includes(optionNames.tobacco))
  filterBitfields.value.childFilters[filterDefinitions[4].key].childFilters[
    optionNames.pharmacy
  ].setChecked(filterValues.value.specialty.includes(optionNames.pharmacy))

  // tests
  filterBitfields.value.childFilters[filterDefinitions[5].key].childFilters[
    optionNames.blood
  ].setChecked(filterValues.value.tests.includes(optionNames.blood))
  filterBitfields.value.childFilters[filterDefinitions[5].key].childFilters[
    optionNames.sti
  ].setChecked(filterValues.value.tests.includes(optionNames.sti))
  filterBitfields.value.childFilters[filterDefinitions[5].key].childFilters[
    optionNames.covid
  ].setChecked(filterValues.value.tests.includes(optionNames.covid))
  filterBitfields.value.childFilters[filterDefinitions[5].key].childFilters[
    optionNames.mammo
  ].setChecked(filterValues.value.tests.includes(optionNames.mammo))
  filterBitfields.value.childFilters[filterDefinitions[5].key].childFilters[
    optionNames.xray
  ].setChecked(filterValues.value.tests.includes(optionNames.xray))

  // languages
  filterBitfields.value.childFilters[filterDefinitions[6].key].childFilters[
    optionNames.spanish
  ].setChecked(filterValues.value.languages.includes(optionNames.spanish))
  filterBitfields.value.childFilters[filterDefinitions[6].key].childFilters[
    optionNames.mandarin
  ].setChecked(filterValues.value.languages.includes(optionNames.mandarin))
  filterBitfields.value.childFilters[filterDefinitions[6].key].childFilters[
    optionNames.vietnamese
  ].setChecked(filterValues.value.languages.includes(optionNames.vietnamese))

  filterBitfields.value.setChecked()
  console.log("WATCH: ", filterBitfields.value.getBitfield())
})

// SEAM: data wiring belongs to the teammate. Returns locations unfiltered for now.
// TODO(teammate): map filterValues → PrimaryCareProperties predicates.
//   ageGroup   → cross-cutting: match *_ad / *_ch fields per selection
//   waitTime   → wait_* fields
//   specialty  → special_* fields
//   tests      → tests_* fields
//   languages  → language field
//   sort       → ordering (apply after filtering; not a predicate)
function applyFilters(
  locations: PrimaryCareLocation[],
  _values: FilterValues
): PrimaryCareLocation[] {
  return locations
}

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

const filteredLocations = computed<PrimaryCareLocation[]>(() => {
  console.log(filterBitfields.value)
  let result = applyFilters(locationsWithDistance.value, filterValues.value)

  if (searchString.value) {
    const terms = searchString.value.replace(/\W+/g, ' ').toLowerCase().split(' ').filter(Boolean)
    result = result.filter((loc) => {
      const haystack = JSON.stringify(Object.values(loc)).toLowerCase()
      return terms.some((term) => haystack.includes(term))
    })
  }

  return result
})

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
  console.log(error)
}

function handleApplyFilter(value: FilterValues) {
  filterValues.value = Object.keys(filterValues.value).length
    ? (value as PrimaryCareFilterValues)
    : emptyFilters
  console.log(filterValues.value)
}

function asPrimaryCareLocation(location: PinboardTypes.BasicLocation) {
  return location as PrimaryCareLocation
}
</script>

<template>
  <PinboardShell
    title="Primary Care Finder"
    :logo="{
      variant: 'city',
      layout: 'single-line',
      colorScheme: 'on-primary',
      customName: 'Primary Care Finder',
      href: '/',
    }"
    info-title="About this tool"
  >
    <template #info-body>
      <span class="has-text-body-small">
        This tool helps Philadelphia residents find free and low-cost primary care providers near
        them. Search by location, filter by services, and view details like hours, transit options,
        and available tests.
      </span>
    </template>

    <PinboardBody
      v-model:filter-values="filterValues"
      :locations="filteredLocations"
      :search-or-user-location="userLocation"
      :is-loading="isLoading"
      :error-message="errorMessage"
      :location-panel-search="searchPlaceholderText"
      :geojson="geojson"
      :is-mobile="isMobile"
      :filters="filterDefinitions"
      @search="handleSearchSubmit"
      @update:filter-values="handleApplyFilter"
    >
      <template #location-card="{ location }">
        <LocationCard :location="location" />
      </template>

      <template #location-detail="{ location, onClose }">
        <LocationDetail :location="asPrimaryCareLocation(location)" :on-close="onClose" />
      </template>

      <template
        #map-content="{
          geojson,
          hoveredId,
          selectedId,
          mobileControlsTarget,
          onHover,
          onHoverEnd,
          onSelect,
        }"
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
          v-if="geojson"
          id="locations"
          :source="{ type: 'geojson', data: toValue(geojson) as any }"
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
  </PinboardShell>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.phila-navbar-brand {
  padding-left: var(--spacing-l);
}
</style>
