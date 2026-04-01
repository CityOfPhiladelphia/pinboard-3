<script setup lang="ts" generic="T">
import '@phila/phila-ui-core/styles/template-light.css'
import { useSlots, inject, ref, computed } from 'vue'
import { MapCard } from '@phila/phila-ui-cards'
import { PINBOARD_CONFIG_KEY } from '../types'
import MapPanel from './MapPanel.vue'
import LocationsPanel from './LocationsPanel.vue'

defineSlots<{
  nav?(): unknown
  'locations-header'?(props: {}): unknown
  'location-detail'?(props: { location: T }): unknown
  'map-content'?(props: {
    locations: T[]
    geojson: unknown
    map: unknown
    zoom: number
    hoveredId: string | null
    selectedId: string | null
    onHover: (id: string) => void
    onHoverEnd: () => void
    onSelect: (loc: T) => void
  }): unknown
}>()

const props = defineProps<{
  locations: T[]
  getId: (loc: T) => string
  getCardDetails: (loc: T) => {
    heading?: string
    subheader?: string
    tag?: string
    body?: string
    src?: string
    alt?: string
    href?: string
    isLoading: boolean
  }
  getPosition?: (loc: T) => [number, number]
  // Optional predicate to hide locations from both the card list and map.
  // Return true to show, false to hide. If not provided, all locations are shown.
  // The app defines its own rules, e.g.:
  //   :filter="(loc) => loc.gaugeHeight !== -9999 && loc.isActive"
  filter?: (loc: T) => boolean
  isLoading: boolean
  errorMessage: string | null
  geojson?: unknown
}>()

const config = inject(PINBOARD_CONFIG_KEY)!
const slots = useSlots()
const mapPanelRef = ref<{ flyTo: (lngLat: [number, number]) => void } | null>(null)

// Apply the filter prop to produce the visible subset of locations.
// Both the card list and the map-content slot receive this filtered list.
const visibleLocations = computed(() =>
  props.filter ? props.locations.filter(props.filter) : props.locations
)

const hoveredLocationId = ref<string | null>(null)
const selectedLocation = ref<T | null>(null)
const activeMobilePanel = ref<'list' | 'map'>('list')

const selectedLocationId = computed(() =>
  selectedLocation.value === null ? null : props.getId(selectedLocation.value)
)

// Only access this when a location is actually selected
const selectedLocationUnsafe = computed<T>(() => selectedLocation.value!)

// Event handlers for location interaction
function handleHover(id: string) {
  hoveredLocationId.value = id
}

function handleHoverEnd() {
  hoveredLocationId.value = null
}

function handleSelect(location: T) {
  selectedLocation.value = location
  if (props.getPosition) {
    mapPanelRef.value?.flyTo(props.getPosition(location))
  }
}

function closeLocationDetail() {
  selectedLocation.value = null
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
        <slot name="location-detail" :location="selectedLocationUnsafe" />
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
              :locations="visibleLocations"
              :hovered-id="hoveredLocationId"
              :selected-id="selectedLocationId"
              :get-id="getId"
              :get-card-details="getCardDetails"
              @select="handleSelect"
              @hover="handleHover"
              @hover-end="handleHoverEnd"
            />
        </div>

        <div
          class="finder-panel-map"
          :class="{ 'is-active': activeMobilePanel === 'map' }"
        >
          <MapPanel
            ref="mapPanelRef"
            :config="config.map"
            :is-loading="isLoading"
            :locations="visibleLocations"
            :geojson="geojson"
            :hovered-id="hoveredLocationId"
            :selected-id="selectedLocationId"
            :map-content-slot="slots['map-content']"
            :on-hover="handleHover"
            :on-hover-end="handleHoverEnd"
            :on-select="handleSelect"
          />
        </div>
      </div>
      <button
        class="mobile-panel-toggle"
        @click="
          activeMobilePanel = activeMobilePanel === 'list' ? 'map' : 'list'
        "
      >
        {{ activeMobilePanel === 'list' ? 'Map view' : 'List view' }}
      </button>
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
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background: var(--Schemes-Primary, #2176d2);
  border: none;
  border-radius: 1.5rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
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
    display: block;
  }

  .detail-overlay {
    width: 100%;
  }

  .pinboard > :deep(footer) {
    display: none;
  }
}
</style>
