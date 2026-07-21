<script setup lang="ts">
import { computed, inject, ref, toRaw } from 'vue'
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
  IS_MOBILE_KEY,
} from '@pinboard/ui'
import type { FilterChoiceBitfieldGroup, FilterValues, MapCardProps } from '@pinboard/ui'
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

const isMobile = inject(IS_MOBILE_KEY, ref(false))
const { t } = useI18n()
const { locations, languages, isLoading, errorMessage, geojson } = useLocations()
const { filterChipDefinitions } = useFilterChipDefinitions(languages)
const calloutOpen = ref(true)
const {
  keywordsForSearch,
  locationSearchMode,
  searchOrUserLocation,
  handleSearchSubmit,
  handleGeolocate,
  handleGeolocateError,
} = PinboardComposables.useUserAndSearchLocations(locations)
const filterState = ref<PrimaryCareFilters>(defaultFilterState)

const { filterLogicalValue, filterLogic } = useFilterLogic(locations, languages, filterState)

const keywordToFilterMap = computed(() => {
  const logicalValues = filterLogic.value as PrimaryCareFilterLogic

  const keywordMap: Record<string, Uint32Array> = {
    [t('ageRange.adults').toLocaleLowerCase()]:
      logicalValues.childFilters.ageRange.childFilters.adult.getBitfield(),
    [t('ageRange.child').toLocaleLowerCase()]:
      logicalValues.childFilters.ageRange.childFilters.children.getBitfield(),
  }

  mapFilterTextToFilterLogic(keywordMap, 'ageRange', logicalValues.childFilters.ageRange)
  mapFilterTextToFilterLogic(keywordMap, 'languages', logicalValues.childFilters.languages)
  mapFilterTextToFilterLogic(keywordMap, 'waitTime', logicalValues.childFilters.waitTime)
  mapFilterTextToFilterLogic(keywordMap, 'visitType', logicalValues.childFilters.visitType)
  mapFilterTextToFilterLogic(keywordMap, 'specialty', logicalValues.childFilters.specialty)
  mapFilterTextToFilterLogic(keywordMap, 'tests', logicalValues.childFilters.tests)

  return keywordMap
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
    ? applyFilters(locations.value, filterLogicalValue.value)
    : locations.value

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
          keywordToFilterMap.value[term][Math.floor(locations.value.indexOf(loc) / 32)] &
            (1 << Math.floor(locations.value.indexOf(loc) % 32))
        return haystack.includes(term) || keywordBits
      })
    })
  }

  return filterState.value.sort ? sortLocations(result, searchOrUserLocation, sortMode) : result
})

function mapFilterTextToFilterLogic(
  keywordMap: Record<string, Uint32Array>,
  filterGroupFieldKey: keyof PrimaryCareFilterLogic['childFilters'],
  filterLogic: FilterChoiceBitfieldGroup
) {
  Object.keys(filterLogic.childFilters).forEach((key) => {
    t(`${filterGroupFieldKey}.${String(key)}`)
      .toLocaleLowerCase()
      .replace(/\W+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .forEach((word) => (keywordMap[word] = filterLogic.childFilters[key].getBitfield()))
  })
}

function handleApplyFilter(values: FilterValues) {
  filterState.value = values as PrimaryCareFilters
}

function getMapCardProps(location: PrimaryCareLocation): MapCardProps {
  return {
    heading: String(location.properties.record ?? location.properties.address ?? ''),
    subheader: location.distance,
    body: String(location.properties.address ?? ''),
  } satisfies MapCardProps
}
</script>

<template>
  <PinboardBody
    :locations="filteredLocations"
    :get-map-card-props="getMapCardProps"
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
      <LocationCard :location="location" />
    </template>

    <template #location-detail="{ location, onClose, onPrint }">
      <LocationDetail :location="location" :is-mobile="isMobile" :on-close="onClose" :on-print="onPrint" />
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
        :show-location-marker="false"
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
            const loc = locations.find((l) => l.id === feature.properties?.id)
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
