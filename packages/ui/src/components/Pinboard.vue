<script setup lang="ts">
import '@phila/phila-ui-core/styles/template-light.css'
import { useSlots, inject, ref, computed } from 'vue'
import { PhilaButton } from '@phila/phila-ui-button'
import { faMap, faList } from '@fortawesome/pro-solid-svg-icons'
import { PINBOARD_CONFIG_KEY, Location, LocationFilterOption } from '../types'
import { MapCard } from '@phila/phila-ui-cards'
import MapPanel from './MapPanel.vue'
import LocationsPanel from './LocationsPanel.vue'

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

const slots = useSlots()
const mapPanelRef = ref<{ panTo: (lngLat: [number, number]) => void } | null>(
  null
)

const hoveredLocationId = ref<string | null>(null)
const selectedLocation = ref<Location | null>(null)
const activeMobilePanel = ref<'list' | 'map'>('list')

const selectedLocationId = computed(() =>
  selectedLocation.value === null ? null : selectedLocation.value.id
)

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
  selectedLocation.value = location
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
        <div
          class="finder-panel-locations"
          :class="{ 'is-active': activeMobilePanel === 'list' }"
        >
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

        <div
          class="finder-panel-map"
          :class="{ 'is-active': activeMobilePanel === 'map' }"
        >
          <MapPanel
            v-if="!isLoading"
            ref="mapPanelRef"
            :config="config.map"
            :locations="locations"
            :geojson="geojson"
            :hovered-id="hoveredLocationId"
            :selected-id="selectedLocationId"
            :map-content-slot="slots['map-content']"
            :on-hover="handleHover"
            :on-hover-end="handleHoverEnd"
            :on-select="handleMapSelect"
          />
        </div>
      </div>
      <PhilaButton
        v-if="selectedLocation === null"
        class="mobile-panel-toggle"
        variant="secondary"
        :icon-definition="activeMobilePanel === 'list' ? faMap : faList"
        :text="activeMobilePanel === 'list' ? 'Map view' : 'List view'"
        @click="
          activeMobilePanel = activeMobilePanel === 'list' ? 'map' : 'list'
        "
      />
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

.mobile-panel-toggle {
  display: none;
  position: fixed;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border-radius: 1.5rem;
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
  .finder-panel-locations {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-right: none;
    display: none;
  }

  .finder-panel-locations.is-active {
    display: flex;
  }

  .finder-panel-map {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
  }

  .finder-panel-map.is-active {
    display: block;
  }

  .finder-panel {
    position: relative;
  }

  .mobile-panel-toggle {
    display: inline-flex;
  }

  .detail-overlay {
    width: 100%;
  }
}
</style>
