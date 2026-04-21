<script setup lang="ts">
// vue imports
import {
  useSlots,
  inject,
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
} from 'vue'

// 3rd party imports
import { faMap } from '@fortawesome/pro-solid-svg-icons'

// philly ui imports
import '@phila/phila-ui-core/styles/template-light.css'
import '@phila/phila-ui-bottom-sheet/dist/phila-ui-bottom-sheet.css' // what does this need to be imported for?
import { MapCard } from '@phila/phila-ui-cards'
import { BottomSheet } from '@phila/phila-ui-bottom-sheet'
import { Search } from '@phila/phila-ui-search'

// pinboard component imports
import MapPanel from './MapPanel.vue'
import LocationsPanel from './LocationsPanel.vue'
import LocationSearchFilterPanel from './LocationSearchFilterPanel.vue'

// type imports
import {
  PINBOARD_CONFIG_KEY,
  BasicLocation,
  LocationFilterOption,
  SortLocationsOptions,
} from '../types'

// slots
defineSlots<{
  nav?(): unknown
  'locations-header'?: unknown
  'location-detail'?: unknown
  'map-content'?(props: {
    locations: BasicLocation[]
    geojson: unknown
    map: unknown
    zoom: number
    isMobile: boolean
    hoveredId: string | null
    selectedId: string | null
    mobileControlsTarget: HTMLDivElement | null
    onHover: (id: string) => void
    onHoverEnd: () => void
    onSelect: (loc: BasicLocation) => void
  }): unknown
}>()

// props
const props = defineProps<{
  locations: BasicLocation[]
  isLoading: boolean
  errorMessage: string | null
  locationPanelFilter?: LocationFilterOption[]
  locationPanelSearch?: string
  locationPanelSort?: SortLocationsOptions
  geojson?: unknown
}>()

// emits to parent app to handle
const emit = defineEmits<{
  locationSearchString: [search: string]
  selectedLocationsFilter: [filter: string]
  sortLocationsOption: [sort: string]
  deselect: [locationId: string]
}>()

// component variables
const snapPoints = [15, 50, 100]
let mql: MediaQueryList | null = null
const config = inject(PINBOARD_CONFIG_KEY)!
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const slots: Record<string, any> = useSlots()

// refs
const isMobile = ref(
  typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 768px)').matches
)
const hoveredLocationId = ref<string | null>(null)
const selectedLocation = ref<BasicLocation | null>(null)
const bottomSheetOpen = ref(true)
const bottomSheetRef = ref<{
  snapTo: (index: number) => void
  displayPercent: number
  isDragging: boolean
} | null>(null)
const mobileControlsTarget = ref<HTMLDivElement | null>(null)
const locationsPanelRef = ref<{
  scrollToCard: (id: string, behavior?: ScrollBehavior) => void
} | null>(null)
const mapPanelRef = ref<{ panTo: (lngLat: [number, number]) => void } | null>(
  null
)

// computed refs
const bottomSheetPercent = computed(
  () => bottomSheetRef.value?.displayPercent ?? snapPoints[0]
)

const bottomSheetDragging = computed(
  () => bottomSheetRef.value?.isDragging ?? false
)

const mobileControlsStyle = computed(() => ({
  bottom: `calc(${bottomSheetPercent.value}% + 10px)`,
  transition: bottomSheetDragging.value ? 'none' : 'bottom 0.3s ease-out',
}))

const selectedLocationId = computed(() =>
  selectedLocation.value === null ? null : selectedLocation.value.id
)

const locationCountLabel = computed(() => {
  const n = props.locations.length
  if (n === 0) return 'No locations match'
  return `${n} item${n > 1 ? 's' : ''}`
})

// watchers
watch(selectedLocation, (loc) => {
  if (loc && isMobile.value) {
    bottomSheetRef.value?.snapTo(snapPoints.length - 1)
  }
})

// event handlers
function handleHover(id: string) {
  hoveredLocationId.value = id
}

function handleHoverEnd() {
  hoveredLocationId.value = null
}

function handleSelect(location: BasicLocation) {
  selectedLocation.value = location
  mapPanelRef.value?.panTo([location.longitude, location.latitude])
}

function handleMapSelect(location: BasicLocation) {
  if (selectedLocation.value?.id === location.id) {
    handleCloseLocationDetail()
  } else {
    selectedLocation.value = location
  }
}

function handleLocationFilterChange(selectedLocationsFilter: string) {
  emit('selectedLocationsFilter', selectedLocationsFilter)
}

function handleLocationSortChange(sortLocationsOption: string) {
  emit('sortLocationsOption', sortLocationsOption)
}

function handleLocationSearchSubmit(locationsSearchString: string) {
  emit('locationSearchString', locationsSearchString)
}

function handleCloseLocationDetail() {
  const closedId = selectedLocation.value?.id ?? null
  if (closedId) {
    emit('deselect', closedId)
  }

  if (isMobile.value && closedId) {
    bottomSheetRef.value?.snapTo(1)
    // Re-center the card in the shrunken list viewport AFTER the sheet
    // snap animation finishes. Keep the list hidden (selectedLocation
    // still truthy) during the snap so the user doesn't see the card
    // drift, then reveal at the correct position via an instant scroll.
    setTimeout(() => {
      locationsPanelRef.value?.scrollToCard(closedId, 'instant')
      selectedLocation.value = null
    }, 350)
  } else {
    selectedLocation.value = null
  }
}

function handleMediaChange(e: MediaQueryListEvent) {
  isMobile.value = e.matches
}

// lifecycle functions
onMounted(() => {
  mql = window.matchMedia('(max-width: 768px)')
  isMobile.value = mql.matches
  mql.addEventListener('change', handleMediaChange)
})

onUnmounted(() => {
  mql?.removeEventListener('change', handleMediaChange)
})

// utility functions
const effectiveMapConfig = (() => {
  // Merge mobile overrides into the map config ONCE at setup — not reactively.
  // Once the map is initialized, we don't want it to re-center or re-zoom if
  // the user changes orientation or resizes across the breakpoint.
  const map = config.map
  if (!map) return undefined
  const { mobile, ...base } = map
  if (isMobile.value && mobile) {
    return { ...base, ...mobile }
  }
  return base
})()
</script>

<template>
  <div v-if="selectedLocation !== null" class="detail-overlay">
    <button
      class="detail-close-btn"
      @click="handleCloseLocationDetail"
      aria-label="Close details"
    >
      ×
    </button>
    <slot name="location-detail" :location="selectedLocation" />
  </div>
  <div class="finder-panel">
    <div class="finder-panel-locations">
      <slot name="locations-header" />

      <div v-if="isLoading" class="location-list">
        <MapCard v-for="n in 5" :key="n" :is-loading="true" />
      </div>

      <div
        v-else-if="errorMessage"
        class="status-message status-message--error"
      >
        {{ errorMessage }}
      </div>

      <LocationsPanel
        v-else-if="!isLoading"
        :locations="locations"
        :location-filter="locationPanelFilter"
        :location-search="locationPanelSearch"
        :location-sort="locationPanelSort"
        :hovered-id="hoveredLocationId"
        :selected-id="selectedLocationId"
        @select="handleSelect"
        @hover="handleHover"
        @hover-end="handleHoverEnd"
        @search-string="handleLocationSearchSubmit"
        @selected-filter="handleLocationFilterChange"
        @sort-option="handleLocationSortChange"
      />
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
      <div class="mobile-map-search-filter">
        <Search
          v-if="locationPanelSearch"
          class-name="mobile-search"
          :placeholder="locationPanelSearch"
        />
        <LocationSearchFilterPanel
          v-if="locationPanelFilter"
          :filterOptions="locationPanelFilter"
          @selected-filter="handleLocationFilterChange"
        />
      </div>
    </div>
  </div>
  <BottomSheet
    ref="bottomSheetRef"
    v-model="bottomSheetOpen"
    :snap-points="snapPoints"
    collapse-label="Map view"
    :collapse-icon="faMap"
    class="mobile-bottom-sheet"
  >
    <div class="bottom-sheet-stack">
      <div
        class="bottom-sheet-list-scroll"
        :class="{ 'is-hidden': selectedLocation }"
      >
        <slot name="locations-header" />
        <div v-if="!isLoading && !errorMessage" class="location-sheet-header">
          <span>{{ locationCountLabel }}</span>
          <LocationSearchFilterPanel
            v-if="locationPanelSort"
            :sortOptions="locationPanelSort"
            @sort-option="handleLocationSortChange"
          />
        </div>

        <div v-if="isLoading" class="location-list">
          <MapCard v-for="n in 5" :key="n" :is-loading="true" />
        </div>

        <div
          v-else-if="errorMessage"
          class="status-message status-message--error"
        >
          {{ errorMessage }}
        </div>

        <LocationsPanel
          v-else
          ref="locationsPanelRef"
          :locations="locations"
          :location-filter="locationPanelFilter"
          :location-search="locationPanelSearch"
          :hovered-id="hoveredLocationId"
          :selected-id="selectedLocationId"
          @select="handleSelect"
          @hover="handleHover"
          @hover-end="handleHoverEnd"
          @selected-filter="handleLocationFilterChange"
        />
      </div>

      <div v-if="selectedLocation" class="bottom-sheet-detail">
        <button
          class="detail-close-btn"
          @click="handleCloseLocationDetail"
          aria-label="Close details"
        >
          ×
        </button>
        <slot name="location-detail" :location="selectedLocation" />
      </div>
    </div>
  </BottomSheet>
</template>

<style>
.phila-navbar .phila-mobile-nav .nav-flyout {
  flex: 0 0 25rem;
  max-width: 25rem;
  height: calc(100vh - var(--nav-bottom));
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
  padding: 0.75rem 1rem 0;
  font-family: var(--Body-Default-font-body-default-family);
}

.mobile-bottom-sheet {
  display: none;
}

.mobile-map-search-filter {
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
  background: var(--Schemes-Surface-Bright, white);
}

.bottom-sheet-list-scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.bottom-sheet-list-scroll.is-hidden {
  visibility: hidden;
}

.bottom-sheet-detail {
  position: absolute;
  inset: 0;
  padding: 1rem;
  background: var(--Schemes-Surface-Bright, white);
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  z-index: 2;
}

.bottom-sheet-detail > * {
  max-width: 100%;
}

.bottom-sheet-detail :deep(img) {
  max-width: 100%;
  height: auto;
}

.bottom-sheet-detail::-webkit-scrollbar {
  display: none;
}

.detail-close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2rem;
  height: 2rem;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: var(--Schemes-On-Surface, #333);
  z-index: 11;
  transition: background-color 0.2s;
}

.detail-close-btn:hover {
  background: rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .finder-panel {
    position: relative;
    display: block;
  }

  .finder-panel-locations {
    display: none;
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

  .mobile-map-search-filter :deep(.location-sort) {
    display: none;
  }

  .mobile-bottom-sheet :deep(.location-filters),
  .mobile-bottom-sheet :deep(.location-search) {
    display: none;
  }

  .detail-overlay {
    display: none;
  }
}
</style>
