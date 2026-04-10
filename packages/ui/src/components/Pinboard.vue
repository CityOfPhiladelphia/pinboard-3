<script setup lang="ts">
import '@phila/phila-ui-core/styles/template-light.css'
import '@phila/phila-ui-bottom-sheet/dist/phila-ui-bottom-sheet.css'
import {
  useSlots,
  inject,
  ref,
  computed,
  onMounted,
  onUnmounted,
  watch,
} from 'vue'
import { BottomSheet } from '@phila/phila-ui-bottom-sheet'
import { Search } from '@phila/phila-ui-search'
import { faMap } from '@fortawesome/pro-solid-svg-icons'
import { PINBOARD_CONFIG_KEY, Location, LocationFilterOption } from '../types'
import { MapCard } from '@phila/phila-ui-cards'
import MapPanel from './MapPanel.vue'
import LocationsPanel from './LocationsPanel.vue'
import LocationSearchFilterPanel from './LocationSearchFilterPanel.vue'

defineSlots<{
  nav?(): unknown
  'locations-header'?(): unknown
  'location-card'?(props: { location: Location }): unknown
  'location-detail'?(props: { location: Location }): unknown
  'map-content'?(props: {
    locations: Location[]
    geojson: unknown
    map: unknown
    zoom: number
    isMobile: boolean
    hoveredId: string | null
    selectedId: string | null
    onHover: (id: string) => void
    onHoverEnd: () => void
    onSelect: (loc: Location) => void
  }): unknown
}>()

const props = defineProps<{
  locations: Location[]
  getCardDetails: (loc: Location) => {
    heading?: string
    subheader?: string
    tag?: string
    body?: string
    src?: string
    alt?: string
    href?: string
    isLoading: boolean
  }
  getPosition?: (loc: Location) => [number, number]
  isLoading: boolean
  errorMessage: string | null
  locationFilter: LocationFilterOption[] | null
  search: string | null
  geojson?: unknown
}>()

// emit to parent app to handle what gets sent to pinboard
const emit = defineEmits<{
  selectedFilter: [filter: string]
  deselect: [locationId: string]
}>()

const config = inject(PINBOARD_CONFIG_KEY)!

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const slots: Record<string, any> = useSlots()
const mapPanelRef = ref<{ panTo: (lngLat: [number, number]) => void } | null>(
  null
)

const isMobile = ref(false)
let mql: MediaQueryList | null = null

function onMediaChange(e: MediaQueryListEvent) {
  isMobile.value = e.matches
}

onMounted(() => {
  mql = window.matchMedia('(max-width: 768px)')
  isMobile.value = mql.matches
  mql.addEventListener('change', onMediaChange)
})

onUnmounted(() => {
  mql?.removeEventListener('change', onMediaChange)
})

const hoveredLocationId = ref<string | null>(null)
const selectedLocation = ref<Location | null>(null)
const bottomSheetOpen = ref(true)
const snapPoints = [15, 50, 75, 100]
const bottomSheetRef = ref<{ snapTo: (index: number) => void } | null>(null)

const selectedLocationId = computed(() =>
  selectedLocation.value === null ? null : selectedLocation.value.id
)

const locationCountLabel = computed(() => {
  const n = props.locations.length
  if (n === 0) return 'No locations match'
  if (n === 1) return '1 item'
  return `${n} items`
})

// Event handlers for location interaction
function handleHover(id: string) {
  hoveredLocationId.value = id
}

function handleHoverEnd() {
  hoveredLocationId.value = null
}

function handleSelect(location: Location) {
  selectedLocation.value = location
  if (props.getPosition) {
    mapPanelRef.value?.panTo(props.getPosition(location))
  }
}

function handleMapSelect(location: Location) {
  if (selectedLocation.value?.id === location.id) {
    closeLocationDetail()
  } else {
    selectedLocation.value = location
  }
}

function closeLocationDetail() {
  if (selectedLocation.value) {
    emit('deselect', selectedLocation.value.id)
  }
  selectedLocation.value = null
}

function handleLocationFilterChange(selectedFilter: string) {
  emit('selectedFilter', selectedFilter)
}

watch(selectedLocation, (loc) => {
  if (loc && isMobile.value) {
    bottomSheetRef.value?.snapTo(snapPoints.length - 1)
  }
})
</script>

<template>
  <div class="pinboard">
    <main class="pinboard-main">
      <div v-if="selectedLocation !== null" class="detail-overlay">
        <button
          class="detail-close-btn"
          @click="closeLocationDetail"
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
            :location-filter="locationFilter"
            :search="search"
            :locations="locations"
            :hovered-id="hoveredLocationId"
            :selected-id="selectedLocationId"
            :get-card-details="getCardDetails"
            @select="handleSelect"
            @hover="handleHover"
            @hover-end="handleHoverEnd"
            @selected-filter="handleLocationFilterChange"
          />
        </div>

        <div class="finder-panel-map">
          <MapPanel
            ref="mapPanelRef"
            :config="config.map"
            :is-loading="isLoading"
            :is-mobile="isMobile"
            :locations="locations"
            :geojson="geojson"
            :hovered-id="hoveredLocationId"
            :selected-id="selectedLocationId"
            :map-content-slot="slots['map-content']"
            :on-hover="handleHover"
            :on-hover-end="handleHoverEnd"
            :on-select="handleMapSelect"
          />
          <div class="mobile-map-search-filter">
            <Search
              v-if="search"
              class-name="mobile-search"
              :placeholder="search"
            />
            <LocationSearchFilterPanel
              v-if="locationFilter"
              :filterOptions="locationFilter"
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
          <div class="bottom-sheet-list-scroll">
            <slot name="locations-header" />
            <div v-if="!isLoading && !errorMessage" class="location-count">
              {{ locationCountLabel }}
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
              :location-filter="locationFilter"
              :search="search"
              :locations="locations"
              :hovered-id="hoveredLocationId"
              :selected-id="selectedLocationId"
              :get-card-details="getCardDetails"
              @select="handleSelect"
              @hover="handleHover"
              @hover-end="handleHoverEnd"
              @selected-filter="handleLocationFilterChange"
            />
          </div>

          <div v-if="selectedLocation" class="bottom-sheet-detail">
            <button
              class="detail-close-btn"
              @click="closeLocationDetail"
              aria-label="Close details"
            >
              ×
            </button>
            <slot name="location-detail" :location="selectedLocation" />
          </div>
        </div>
      </BottomSheet>
    </main>
  </div>
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
.pinboard {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pinboard-main {
  position: relative;
  flex: 1;
  overflow: hidden;
}

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

.location-count {
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

.bottom-sheet-stack {
  position: relative;
  height: 100%;
}

.bottom-sheet-list-scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
}

.bottom-sheet-detail {
  position: absolute;
  inset: 0;
  padding: 1rem;
  background: var(--Schemes-Surface-Bright, white);
  overflow-y: auto;
  scrollbar-width: none;
  z-index: 1;
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

  .mobile-map-search-filter {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 60px;
    z-index: 2;
    padding: 0.5rem;
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
    gap: 0.25rem;
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
