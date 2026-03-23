<script setup lang="ts" generic="T">
import '@phila/phila-ui-core/styles/template-light.css'
import { AppFooter } from '@phila/phila-ui-app-footer'
import { AppHeader } from '@phila/phila-ui-app-header'
import { useSlots, inject, ref, computed, FunctionalComponent, h, Component } from 'vue'
import { PINBOARD_CONFIG_KEY } from '../types'
import SearchFilterPanel from './SearchFilterPanel.vue'
import MapPanel from './MapPanel.vue'
import LocationsPanel from './LocationsPanel.vue'
import { Logo } from "@phila/phila-ui-logo";

defineSlots<{
  home?(props: { activateFinder: () => void }): unknown
  nav?(): unknown
  'location-override'?(): unknown
  'locations-header'?(props: {}): unknown
  'location-card'?(props: { location: T }): unknown
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
  locations: T[],
  getId: (loc: T) => string,
  override: boolean,
  isLoading: boolean,
  errorMessage: string | null,
  geojson?: unknown,
  navComponent: Component
}>()

const config = inject(PINBOARD_CONFIG_KEY)!
const slots = useSlots()
// const store = usePinboardStore()

const hoveredLocationId = ref<string | null>(null);
const selectedLocation = ref<T | null>(null);
const activeMobilePanel = ref<'list' | 'map'>('list');
const howYouKnow = ref(false);
const navOpen = ref(false);

const selectedLocationId = computed(() => selectedLocation.value === null ? null : props.getId(selectedLocation.value))

// Only access thhis when a location is actually selected
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
}

function closeLocationDetail() {
  selectedLocation.value = null
}

</script>

<template>
  <div class="pinboard">

    <div>
      <!-- American flag -->
      <svg width="16" height="11" viewBox="0 0 16 11" fill="none" xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink">
        <rect width="16" height="11" fill="url(#pattern0_61022_1867)" />
        <defs>
          <pattern id="pattern0_61022_1867" patternContentUnits="objectBoundingBox" width="1" height="1">
            <use xlink:href="#image0_61022_1867" transform="scale(0.0625 0.0909091)" />
          </pattern>
          <image id="image0_61022_1867" width="16" height="11" preserveAspectRatio="none"
            xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAALCAMAAABBPP0LAAAAG1BMVEUdM7EeNLIeM7HgQCDaPh/bPh/bPx/////bPyBEby41AAAAUElEQVQI123MNw4CABDEwD3jC/9/MQ1BQrgeOSkIqYe2o2FZtthXgQLgbHVMZdlsfUQFQnHtjP1+8BUhBDKOqtmfot6ojqPzR7TjdU+f6vkED+IDPhTBcMAAAAAASUVORK5CYII=" />
        </defs>
      </svg>

      An official website of the City of Philadelphia government
      <button @click="() => howYouKnow = !howYouKnow">Here's how you know {{ howYouKnow ? '▴' : '▾' }}</button>
    </div>

    <div v-if="howYouKnow">
      🔒 The https:// in the address bar means your information is encrypted and can not be accessed by anyone else
      🏛️ Only government entities in the U.S. can end in .gov
      <button @click="() => howYouKnow = false">✕</button>
    </div>

    <div>
      <button @click="() => navOpen = !navOpen"> {{ navOpen ? '✕' : '≡' }} </button>
      <Logo variant="city" layout="stacked" color-scheme="on-primary" class="phila-navbar-logo" />
    </div>

    <div v-if="navOpen">
      <slot name="nav"></slot>
    </div>


    <AppHeader id="pinboard-nav" :show-trusted-site="true" :mobile-nav="navComponent" :links="[]" :navbar-brand="{
      brandingImage: { src: '', href: '/', altText: 'City of Philadelphia' },
      brandingLink: { text: config.title, href: '/' },
    }" />

    <main class="pinboard-main">
      <div class="finder-panel">

        <div class="finder-panel-locations" :class="{ 'is-active': activeMobilePanel === 'list' }">
          <template v-if="override">
            <slot name="location-override"></slot>
          </template>
          <template v-else>
            <slot name="locations-header" />

            <SearchFilterPanel :locations="locations" />

            <div v-if="isLoading" class="status-message">
              Loading...
            </div>

            <div v-else-if="errorMessage" class="status-message status-message--error">
              {{ errorMessage }}
            </div>

            <LocationsPanel v-else-if="!isLoading" :locations="locations" :hovered-id="hoveredLocationId"
              :selected-id="selectedLocationId" :location-card-slot="slots['location-card']" :get-id="getId"
              @select="handleSelect" @hover="handleHover" @hover-end="handleHoverEnd" />
          </template>
        </div>

        <div class="finder-panel-map" :class="{ 'is-active': activeMobilePanel === 'map' }">
          <MapPanel v-if="!isLoading" :config="config.map" :locations="locations" :geojson="geojson"
            :hovered-id="hoveredLocationId" :selected-id="selectedLocationId" :map-content-slot="slots['map-content']"
            :on-hover="handleHover" :on-hover-end="handleHoverEnd" :on-select="handleSelect" />
        </div>
      </div>
      <button class="mobile-panel-toggle" @click="activeMobilePanel = activeMobilePanel === 'list' ? 'map' : 'list'">
        {{ activeMobilePanel === 'list' ? 'Map view' : 'List view' }}
      </button>

      <div v-if="selectedLocation !== null" class="detail-overlay">
        <button class="detail-close-btn" @click="closeLocationDetail" aria-label="Close details">×</button>
        <slot name="location-detail" :location="selectedLocationUnsafe" />
      </div>


    </main>

    <AppFooter :sub-footer-only="true" />
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
  height: 100vh;
}

.pinboard-main {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.finder-panel {
  display: flex;
  width: 100%;
  height: 100%;
}

.finder-panel-locations {
  display: flex;
  flex-direction: column;
  width: 25%;
  border-right: 1px solid #ccc;
  overflow: hidden;
}

.home-content {
  height: 100%;
  overflow-y: auto;
  padding: 2rem;
}

.status-message {
  padding: 1rem;
  color: var(--Schemes-On-Surface, #333);
}

.status-message--error {
  color: var(--Schemes-Error, #b3261e);
}

.finder-panel-locations> :deep(.location-list) {
  flex: 1;
  overflow-y: auto;
}

.finder-panel-map {
  width: 75%;
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
  width: 33%;
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

  .pinboard> :deep(footer) {
    display: none;
  }
}
</style>
