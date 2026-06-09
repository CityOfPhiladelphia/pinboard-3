<script setup lang="ts">
// vue imports
import { useSlots, inject, ref, computed, watch } from 'vue'

// 3rd party imports
import { faMap } from '@fortawesome/pro-solid-svg-icons'

// philly ui imports
import '@phila/phila-ui-core/styles/template-light.css'
import '@phila/phila-ui-bottom-sheet/dist/phila-ui-bottom-sheet.css'
import { MapCard } from '@phila/phila-ui-cards'
import { BottomSheet } from '@phila/phila-ui-bottom-sheet'

// import pinboard config
import { PINBOARD_CONFIG_KEY } from '../plugin'

// pinboard component imports
import MapPanel from './MapPanel.vue'
import LocationsPanel from './LocationsPanel.vue'
import FilterChipBar from './FilterChipBar.vue'
import AllFiltersPanel from './AllFiltersPanel.vue'

// pinboard composables imports

// type imports
import type {
  BasicLocation,
  LatLon,
  LocationFilterOption,
  SearchMode,
  SortLocationsOptions,
} from '../types'
import type { FilterDefinition, FilterValues } from '@phila/phila-ui-filter-chip'
import { hasLocationData } from '../utilities/hasLocationData'

// slots
defineSlots<{
  nav?(): unknown
  'locations-header'?: unknown
  'location-detail'?(props: { location: BasicLocation; onClose: () => void }): unknown
  'map-content'?(props: {
    locations: BasicLocation[]
    geojson: unknown
    map: unknown
    zoom: number
    hoveredId: string | null
    selectedId: string | null
    mobileControlsTarget: HTMLDivElement | null
    mobileControlsTargetLeft: HTMLDivElement | null
    onHover: (id: string) => void
    onHoverEnd: () => void
    onSelect: (loc: BasicLocation) => void
  }): unknown
}>()

// props
const props = defineProps<{
  locations: BasicLocation[]
  searchOrUserLocation: LatLon
  isLoading: string | false
  errorMessage: string | null
  locationPanelFilter?: LocationFilterOption[]
  locationPanelSearch?: string
  locationPanelSort?: SortLocationsOptions
  locationSearchMode?: SearchMode
  locationPanelLocationAvailable?: boolean
  geojson?: unknown
  isMobile: boolean
  filters?: FilterDefinition[]
  filterValues?: FilterValues
}>()

// emits to parent app to handle
const emit = defineEmits<{
  search: [search: string]
  selectedLocationsFilter: [filter: string]
  sortLocationsOption: [sort: string]
  deselect: [locationId: string]
  'update:filterValues': [value: FilterValues]
}>()

// filter state
const allFiltersOpen = ref(false)

function onFilterValues(value: FilterValues) {
  emit('update:filterValues', value)
}

// component variables
const snapPoints = [15, 50, 100]
const config = inject(PINBOARD_CONFIG_KEY)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const slots: Record<string, any> = useSlots()

// refs
const hoveredLocationId = ref<string | undefined>(undefined)
const selectedLocation = ref<BasicLocation | undefined>(undefined)
const bottomSheetOpen = ref(true)
const bottomSheetRef = ref<{
  snapTo: (index: number) => void
  displayPercent: number
  isDragging: boolean
} | null>(null)
const mobileControlsTarget = ref<HTMLDivElement | null>(null)
const mobileControlsTargetLeft = ref<HTMLDivElement | null>(null)
const locationsPanelRef = ref<{
  scrollToCard: (id: string, behavior?: ScrollBehavior) => void
} | null>(null)
const mapPanelRef = ref<{ panTo: (coordinates: LatLon) => void } | null>(null)
const searchString = ref<string>('')

// computed refs
const bottomSheetPercent = computed(() => bottomSheetRef.value?.displayPercent ?? snapPoints[0])

const bottomSheetDragging = computed(() => bottomSheetRef.value?.isDragging ?? false)

const mobileControlsStyle = computed(() => {
  const percent = bottomSheetPercent.value
  const opacity = percent <= 50 ? 1 : Math.max(0, 1 - (percent - 50) / 20)
  return {
    bottom: `calc(${percent}% + 10px)`,
    opacity,
    transition: bottomSheetDragging.value ? 'none' : 'bottom 0.3s ease-out, opacity 0.3s ease-out',
  }
})

const selectedLocationId = computed(() =>
  selectedLocation.value === undefined ? undefined : selectedLocation.value.id
)

const locationCountLabel = computed(() => {
  const message = props.locations.length
    ? `${props.locations.length} item${props.locations.length > 1 ? 's' : ''}`
    : 'No locations match'
  return props.isLoading || message
})

// watchers
watch(selectedLocation, (loc) => {
  if (loc && props.isMobile) {
    bottomSheetRef.value?.snapTo(snapPoints.length - 1)
  }
})

watch(
  () => props.searchOrUserLocation,
  (newLocation) => {
    if (
      hasLocationData(newLocation) &&
      props.locationSearchMode &&
      ['address', 'zipcode'].includes(props.locationSearchMode)
    ) {
      mapPanelRef.value?.panTo(newLocation)
    }
  },
  { deep: 1 }
)

// event handlers
function handleHover(id: string) {
  hoveredLocationId.value = id
}

function handleHoverEnd() {
  hoveredLocationId.value = undefined
}

function selectLocation(location: BasicLocation) {
  // Swapping to a different location counts as "viewing" the outgoing one —
  // emit deselect so consumers can mark it as visited.
  if (selectedLocation.value && selectedLocation.value.id !== location.id) {
    emit('deselect', selectedLocation.value.id)
  }
  selectedLocation.value = location
}

function handleSelect(location: BasicLocation) {
  selectLocation(location)
  mapPanelRef.value?.panTo(location)
}

function handleMapSelect(location: BasicLocation) {
  if (selectedLocation.value?.id === location.id) {
    handleCloseLocationDetail()
  } else {
    selectLocation(location)
  }
}

function handleLocationFilterChange(selectedLocationsFilter: string) {
  emit('selectedLocationsFilter', selectedLocationsFilter)
}

function handleLocationSortChange(sortLocationsOption: string) {
  emit('sortLocationsOption', sortLocationsOption)
}

function handleSearchChange(search: string) {
  searchString.value = search
  if (!searchString.value) {
    emit('search', '')
  }
}

function handleSearchSubmit() {
  emit('search', searchString.value)
}

function handleCloseLocationDetail() {
  const closedId = selectedLocation.value?.id ?? null
  if (closedId) {
    emit('deselect', closedId)
  }

  if (props.isMobile && closedId) {
    bottomSheetRef.value?.snapTo(1)
    // Re-center the card in the shrunken list viewport AFTER the sheet
    // snap animation finishes. Keep the list hidden (selectedLocation
    // still truthy) during the snap so the user doesn't see the card
    // drift, then reveal at the correct position via an instant scroll.
    setTimeout(() => {
      locationsPanelRef.value?.scrollToCard(closedId, 'instant')
      selectedLocation.value = undefined
    }, 350)
  } else {
    selectedLocation.value = undefined
  }
}

// utility functions
const effectiveMapConfig = (() => {
  // Merge mobile overrides into the map config ONCE at setup — not reactively.
  // Once the map is initialized, we don't want it to re-center or re-zoom if
  // the user changes orientation or resizes across the breakpoint.
  const map = config?.map
  if (!map) return map
  const { mobile, ...base } = map
  if (props.isMobile && mobile) {
    return { ...base, ...mobile }
  }
  return base
})()
</script>

<template>
  <div v-if="selectedLocation !== undefined && !isMobile" class="detail-overlay">
    <slot
      name="location-detail"
      :location="selectedLocation"
      :on-close="handleCloseLocationDetail"
    />
  </div>
  <div class="finder-panel">
    <div class="finder-panel-locations">
      <slot name="locations-header" />

      <div v-if="errorMessage" class="status-message status-message--error">
        {{ errorMessage }}
      </div>

      <div v-else-if="isLoading">
        <MapCard
          v-for="n in 5"
          :key="n"
          :is-loading="true"
          :style="{ display: isMobile ? 'none' : 'block' }"
        />
      </div>

      <Teleport v-else to="#locations-panel-mobile" :disabled="!isMobile">
        <LocationsPanel
          ref="locationsPanelRef"
          :locations="locations"
          :location-filter="locationPanelFilter"
          :location-search="locationPanelSearch"
          :location-sort="locationPanelSort"
          :location-available="locationPanelLocationAvailable"
          :hovered-id="hoveredLocationId"
          :selected-id="selectedLocationId"
          :is-mobile="isMobile"
          @select="handleSelect"
          @hover="handleHover"
          @hover-end="handleHoverEnd"
          @search-string="handleSearchChange"
          @search="handleSearchSubmit"
          @selected-filter="handleLocationFilterChange"
          @sort-option="handleLocationSortChange"
        >
          <template v-if="filters" #below-search>
            <FilterChipBar
              :filters="filters"
              :model-value="filterValues ?? {}"
              @update:model-value="onFilterValues"
              @open-filters="allFiltersOpen = true"
            />
          </template>
        </LocationsPanel>
      </Teleport>
    </div>

    <div class="finder-panel-map">
      <MapPanel
        ref="mapPanelRef"
        :config="effectiveMapConfig"
        :is-loading="isLoading"
        :is-mobile="isMobile"
        :locations="locations"
        :geojson="geojson"
        :hovered-id="hoveredLocationId"
        :selected-id="selectedLocationId"
        :mobile-controls-target="mobileControlsTarget"
        :mobile-controls-target-left="mobileControlsTargetLeft"
        :map-content-slot="slots['map-content']"
        :on-hover="handleHover"
        :on-hover-end="handleHoverEnd"
        :on-select="handleMapSelect"
      />
      <div
        v-if="isMobile"
        ref="mobileControlsTarget"
        class="mobile-controls-float"
        :style="mobileControlsStyle"
      />
      <div
        v-if="isMobile"
        ref="mobileControlsTargetLeft"
        class="mobile-controls-float-left"
        :style="mobileControlsStyle"
      />
      <div id="mobile-map-search-filter" class="mobile-map-search-filter"></div>
    </div>

    <Teleport to="body" :disabled="!isMobile">
      <div v-if="filters" class="all-filters-overlay" :class="{ open: allFiltersOpen }">
        <AllFiltersPanel
          v-model:open="allFiltersOpen"
          :filters="filters"
          :model-value="filterValues ?? {}"
          @update:model-value="onFilterValues"
        />
      </div>
    </Teleport>
  </div>
  <BottomSheet
    ref="bottomSheetRef"
    v-model="bottomSheetOpen"
    :snap-points="snapPoints"
    :collapse-label="selectedLocation ? '' : 'Map view'"
    :collapse-icon="selectedLocation ? undefined : faMap"
    class="mobile-bottom-sheet"
  >
    <div class="bottom-sheet-stack">
      <div class="bottom-sheet-list-scroll" :class="{ 'is-hidden': selectedLocation }">
        <slot name="locations-header" />
        <div class="location-sheet-header">
          <span>{{ locationCountLabel }}</span>
          <div id="bottom-sheet-sort"></div>
        </div>

        <div id="locations-panel-mobile"></div>
      </div>

      <div v-if="selectedLocation" class="bottom-sheet-detail">
        <slot
          name="location-detail"
          :location="selectedLocation"
          :on-close="handleCloseLocationDetail"
        />
      </div>
    </div>
  </BottomSheet>
</template>

<style>
.phila-navbar .phila-mobile-nav .nav-flyout {
  flex: 0 0 25rem;
  max-width: 25rem;
  height: calc(100dvh - var(--nav-bottom));
}

.phila-navbar .phila-mobile-nav .nav-flyout .p-4 {
  display: flex;
  flex-direction: column;
  row-gap: var(--spacing-m);
}
</style>

<style scoped>
.finder-panel {
  display: grid;
  grid-template-columns: 1fr 2fr;
  width: 100%;
  height: 100%;
  position: relative;
}

.finder-panel-locations {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ccc;
  overflow: hidden;
}

.status-message--error {
  color: var(--Schemes-Error, #b3261e);
}

.finder-panel-locations > :deep(.location-list),
.finder-panel-locations > .location-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.finder-panel-map {
  overflow: hidden;
}

.location-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  font-family: var(--Body-Default-font-body-default-family);
  font-weight: 700;
}

.bottom-sheet-list-scroll :deep(.location-list) {
  padding-top: 0.5rem;
}

.mobile-bottom-sheet {
  display: none;
}

.detail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 40%;
  z-index: 10;
  background: var(--Schemes-Surface-Bright, white);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-bottom-sheet :deep(.bottom-sheet-content) {
  overflow-x: hidden;
}

.bottom-sheet-stack {
  position: relative;
  height: 100%;
  width: 100%;
  max-width: 100%;
  background: transparent;
}

.bottom-sheet-list-scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}

.bottom-sheet-list-scroll::-webkit-scrollbar {
  display: none;
}

.bottom-sheet-list-scroll.is-hidden {
  visibility: hidden;
}

.bottom-sheet-detail {
  position: absolute;
  inset: 0;
  background: transparent;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 2;
}

.bottom-sheet-detail > * {
  max-width: 100%;
}

.bottom-sheet-detail :deep(img) {
  max-width: 100%;
  height: auto;
}

.all-filters-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  /* Match the locations panel: the 1fr of the finder's `1fr 2fr` grid = 1/3. */
  width: calc(100% / 3);
  z-index: 12;
  background: var(--Schemes-Surface-Bright, #fff);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  display: none;
}

.all-filters-overlay.open {
  display: block;
}

/* Keep in sync with mobileMaxWidth in useIsMobile.ts */
@media (max-width: 768px) {
  .finder-panel {
    position: relative;
    display: block;
  }

  .finder-panel-map {
    width: 100%;
    height: 100%;
  }

  .mobile-bottom-sheet {
    display: block;
  }

  .mobile-controls-float {
    position: absolute;
    right: 10px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    pointer-events: none;
  }

  .mobile-controls-float > :deep(*) {
    pointer-events: auto;
  }

  .mobile-controls-float-left {
    position: absolute;
    left: 10px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    pointer-events: none;
  }

  .mobile-controls-float-left > :deep(*) {
    pointer-events: auto;
  }

  .mobile-map-search-filter {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2;
    padding: 10px 24px;
  }

  .mobile-map-search-filter :deep(.mobile-search) {
    width: 100%;
    box-sizing: border-box;
  }

  .mobile-map-search-filter :deep(.mobile-search .state-layer),
  .mobile-map-search-filter :deep(.mobile-search .content) {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  .mobile-map-search-filter :deep(.mobile-search .phila-text-field) {
    padding: 0 var(--scale-small, 0.5rem) !important;
  }

  .mobile-map-search-filter :deep(.location-filters) {
    padding: 0.25rem 0 0;
    padding-left: 2px;
    gap: 0.25rem;
  }

  /* Full-screen modal that covers the bottom sheet and map, rather than a
     slide-over panel trapped inside the finder panel. */
  .all-filters-overlay {
    position: fixed;
    inset: 0;
    width: 100%;
    z-index: 1100;
    box-shadow: none;
  }
}
</style>
