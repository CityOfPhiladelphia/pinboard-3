<script setup lang="ts">
import { computed, ref, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  PinboardBody,
  CircleLayer,
  MapNavigationControl,
  MapIconTextPin,
  MapMarker,
  GeolocationButton,
  BasemapToggle,
  PinboardComposables,
  PinboardUtilities,
  Callout,
  applyFilters,
} from '@pinboard/ui'
import type { FilterValues, PinboardTypes } from '@pinboard/ui'
import { useLocations } from '@/composables/useLocations'
import { useFilterChipDefinitions } from '@/composables/filters/useFilterChipDefinitions.ts'
import { useFilterLogic } from '@/composables/filters/useFilterLogic'
import LocationCard from '@/components/LocationCard.vue'
import LocationDetail from '@/components/LocationDetail.vue'
import { IconLocationDot } from '@phila/phila-ui-core/icons'
import type {
  PrimaryCareFilterLogic,
  PrimaryCareFilters,
  PrimaryCareLocation,
  PrimaryCareResponse,
  SortMode,
  SpecialtyFilterKey,
  TestsFilterKey,
  VisitTypeFilterKey,
  WaitTimeFilterKey,
} from '@/types'
import { sortLocations } from '@/utilities/sortLocations'

const defaultFilterState: PrimaryCareFilters = {
  sort: {
    distance: false,
    name: false,
  },
  ageRange: {
    adult: false,
    children: false,
  },
  visitType: {
    blood: false,
    covid: false,
    dental: false,
    eye: false,
    mammo: false,
    mat: false,
    mental: false,
    nutrition: false,
    pharmacy: false,
    podiatry: false,
    prenatal: false,
    sick: false,
    sports: false,
    telehealth: false,
    vaccine: false,
    well: false,
    women: false,
    sti: false,
    tobacco: false,
    xray: false,
  },
  waitTime: {
    walkIn: false,
    twoMonths: false,
    oneWeekSick: false,
    oneWeekWell: false,
  },
  languages: {
    english: false,
  },
}

const { t } = useI18n()
const isMobile = PinboardComposables.useIsMobile()
const { locations, languages, isLoading, errorMessage, geojson } = useLocations()
const { filterChipDefinitions } = useFilterChipDefinitions(languages)
const calloutOpen = ref(true)
// Location is requested only when the user clicks the geolocation button, which
// emits to handleGeolocate. The shared useUserLocation composable prompts on load,
// which the primary care finder intentionally avoids.
const userLocation = ref<PinboardTypes.LatLon>({
  latitude: NaN,
  longitude: NaN,
})
const addressForSearch = ref<string>('')
const { addressCoordinates, finishedAddressFetch } =
  PinboardComposables.useSearchAddress(addressForSearch)
const zipcodeForSearch = ref<string>('')
const { zipcodePolygon, finishedZipFetch } = PinboardComposables.useSearchZipcode(zipcodeForSearch)
const keywordsForSearch = ref<string>('')
const locationSearchMode = ref<PinboardTypes.SearchMode>(undefined)
const { searchOrUserLocation } = PinboardComposables.useUserAndSearchLocations(
  userLocation,
  addressCoordinates,
  finishedAddressFetch,
  zipcodePolygon,
  finishedZipFetch
)
const filterState = ref<PrimaryCareFilters>(defaultFilterState)

const { filterLogicalValue, filterLogic } = useFilterLogic(locations, languages, filterState)

const keywordToFilterMap = computed(() => {
  const logicalValues = filterLogic.value as PrimaryCareFilterLogic

  const keywordMap: Record<string, Uint32Array> = {
    [t('ageRange.adult').toLocaleLowerCase()]:
      logicalValues.childFilters.ageRange.childFilters.adult.getBitfield(),
    [t('ageRange.adults').toLocaleLowerCase()]:
      logicalValues.childFilters.ageRange.childFilters.adult.getBitfield(),
    [t('ageRange.child').toLocaleLowerCase()]:
      logicalValues.childFilters.ageRange.childFilters.children.getBitfield(),
    [t('ageRange.children').toLocaleLowerCase()]:
      logicalValues.childFilters.ageRange.childFilters.children.getBitfield(),

    ...Object.fromEntries(
      Array.from(languages.value, (lang) => {
        return [
          t(`languages.${lang}`).toLocaleLowerCase(),
          logicalValues.childFilters.languages.childFilters[lang].getBitfield(),
        ]
      })
    ),
  }

  Object.keys(logicalValues.childFilters.waitTime.childFilters).forEach((key) => {
    t(`waitTime.${key}`)
      .toLocaleLowerCase()
      .replace(/\W+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .forEach(
        (word) =>
          (keywordMap[word] =
            logicalValues.childFilters.waitTime.childFilters[
              key as WaitTimeFilterKey
            ].getBitfield())
      )
  })

  Object.keys(logicalValues.childFilters.visitType.childFilters).forEach((key) => {
    t(`visitType.${key}`)
      .toLocaleLowerCase()
      .replace(/\W+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .forEach(
        (word) =>
          (keywordMap[word] =
            logicalValues.childFilters.visitType.childFilters[
              key as VisitTypeFilterKey
            ].getBitfield())
      )
  })

  Object.keys(logicalValues.childFilters.specialty.childFilters).forEach((key) => {
    t(`specialty.${key}`)
      .toLocaleLowerCase()
      .replace(/\W+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .forEach(
        (word) =>
          (keywordMap[word] =
            logicalValues.childFilters.specialty.childFilters[
              key as SpecialtyFilterKey
            ].getBitfield())
      )
  })

  Object.keys(logicalValues.childFilters.tests.childFilters).forEach((key) => {
    t(`tests.${key}`)
      .toLocaleLowerCase()
      .replace(/\W+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .forEach(
        (word) =>
          (keywordMap[word] =
            logicalValues.childFilters.tests.childFilters[key as TestsFilterKey].getBitfield())
      )
  })

  return keywordMap
})

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

const sortMode = computed<SortMode>(() => {
  return filterState.value.sort.name ? 'name' : filterState.value.sort.distance ? 'distance' : ''
})

const filteredGeojson = computed<PrimaryCareResponse | undefined>(() => {
  if (!(geojson.value && geojson.value?.features)) {
    return undefined
  }

  let result = filterLogicalValue.value.length
    ? applyFilters(geojson.value.features, filterLogicalValue.value)
    : geojson.value.features

  if (keywordsForSearch.value) {
    const terms = keywordsForSearch.value
      .replace(/[!-/:-@[-`{-~]/g, ' ')
      .toLocaleLowerCase()
      .split(' ')
      .filter(Boolean)
    result = result.filter((loc) => {
      const haystack = JSON.stringify(Object.values(loc.properties)).toLocaleLowerCase()
      return terms.some((term) => {
        const keywordBits = geojson.value
          ? keywordToFilterMap.value?.[term] &&
            keywordToFilterMap.value[term][Math.floor(geojson.value.features.indexOf(loc) / 32)] &
              (1 << Math.floor(geojson.value.features.indexOf(loc) % 32))
          : 0
        return haystack.includes(term) || keywordBits
      })
    })
  }

  return {
    type: 'FeatureCollection',
    features: result,
  }
})

const filteredLocations = computed<PrimaryCareLocation[]>(() => {
  let result = filterLogicalValue.value.length
    ? applyFilters(locationsWithDistance.value, filterLogicalValue.value)
    : locationsWithDistance.value

  if (keywordsForSearch.value) {
    const terms = keywordsForSearch.value
      .replace(/[!-/:-@[-`{-~]/g, ' ')
      .toLocaleLowerCase()
      .split(' ')
      .filter(Boolean)
    result = result.filter((loc) => {
      const haystack = JSON.stringify(Object.values(loc.properties)).toLocaleLowerCase()
      return terms.some((term) => {
        const keywordBits =
          keywordToFilterMap.value?.[term] &&
          keywordToFilterMap.value[term][
            Math.floor(locationsWithDistance.value.indexOf(loc) / 32)
          ] &
            (1 << Math.floor(locationsWithDistance.value.indexOf(loc) % 32))
        return haystack.includes(term) || keywordBits
      })
    })
  }

  return filterState.value.sort ? sortLocations(result, searchOrUserLocation, sortMode) : result
})

function handleSearchSubmit(locationSearchString: string) {
  switch (true) {
    case PinboardUtilities.StreetAddress.test(locationSearchString):
    case PinboardUtilities.StreetIntersection.test(locationSearchString): {
      locationSearchMode.value = 'address'
      addressForSearch.value = locationSearchString
      zipcodeForSearch.value = ''
      keywordsForSearch.value = ''
      break
    }
    case PinboardUtilities.Zipcode.test(locationSearchString): {
      locationSearchMode.value = 'zipcode'
      zipcodeForSearch.value = locationSearchString
      addressForSearch.value = ''
      keywordsForSearch.value = ''
      break
    }
    case locationSearchString !== '': {
      locationSearchMode.value = 'keyword'
      keywordsForSearch.value = locationSearchString
      addressForSearch.value = ''
      zipcodeForSearch.value = ''
      break
    }
    default: {
      locationSearchMode.value = undefined
      addressForSearch.value = locationSearchString
      zipcodeForSearch.value = locationSearchString
      keywordsForSearch.value = locationSearchString
    }
  }
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
  filterState.value = values as PrimaryCareFilters
}

function asPrimaryCareLocation(location: PinboardTypes.BasicLocation) {
  return location as PrimaryCareLocation
}
</script>

<template>
  <PinboardBody
    :locations="filteredLocations"
    :search-or-user-location="searchOrUserLocation"
    :location-search-mode="locationSearchMode"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :location-panel-search="t('searchPlaceholder')"
    :geojson="filteredGeojson"
    :is-mobile="isMobile"
    :filters="filterChipDefinitions"
    :filter-values="filterState"
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

    <template #location-detail="{ location, onClose, onPrint }">
      <LocationDetail
        :location="asPrimaryCareLocation(location)"
        :on-close="onClose"
        :on-print="onPrint"
      />
    </template>

    <template
      #map-content="{
        hoveredId,
        selectedId,
        zoom,
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
      <MapMarker
        v-if="PinboardUtilities.hasLocationData(searchOrUserLocation)"
        key="searchOrUserLocation"
        :lng-lat="[searchOrUserLocation.longitude, searchOrUserLocation.latitude]"
      >
        <MapIconTextPin :zoom="zoom" :icon="IconLocationDot" color-theme="light-tertiary" />
      </MapMarker>
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
