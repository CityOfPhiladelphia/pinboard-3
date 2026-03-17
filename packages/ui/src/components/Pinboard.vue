<script setup lang="ts">
import '@phila/phila-ui-core/styles/template-light.css'
import { AppFooter } from '@phila/phila-ui-app-footer'
import { AppHeader } from '@phila/phila-ui-app-header'
import { h, ref, computed, watch, nextTick, useSlots, inject, type FunctionalComponent } from 'vue'
import { PINBOARD_CONFIG_KEY, type Location } from '../types'
import { usePinboardStore } from '../stores/pinboard'
import SearchFilterPanel from './SearchFilterPanel.vue'
import MapPanel from './MapPanel.vue'
import LocationsPanel from './LocationsPanel.vue'

defineSlots<{
  home?(props: { activateFinder: () => void }): unknown
  'locations-header'?(props: {}): unknown
  'location-card'?(props: { location: Location }): unknown
  'location-detail'?(props: { location: Location; onClose: (e: MouseEvent) => void }): unknown
  'map-content'?(props: {
    locations: unknown
    geojson: unknown
    map: unknown
    zoom: number
    hoveredId: string | null
    selectedId: string | null
    onHover: (id: string) => void
    onHoverEnd: () => void
    onSelect: (loc: unknown) => void
  }): unknown
}>()

const props = defineProps<{
  locations?: Location[]
}>()

const config = inject(PINBOARD_CONFIG_KEY)!
const slots = useSlots()
const store = usePinboardStore()

// Feed data from the injected composable into the store
const composableState = config.useLocations()
watch(composableState, (newState) => store.setState(newState), { immediate: true })

// Use prop-provided locations (filtered by app) or fall back to all locations
const displayLocations = computed(() => props.locations ?? store.allLocations)
const isLoaded = computed(() => store.state.kind === 'Loaded')

// Focus management — stays local (DOM concern, not shared state)
const returnFocusTarget = ref<HTMLElement | null>(null)

const MobileNavContent: FunctionalComponent = () =>
  h('div', { class: 'content nav-flyout has-background-ghost-gray is-flex is-12 is-12-mobile', tabindex: -1 }, [
    h('div', { class: 'p-4' }, [
      h('h4', null, h('a', { href: '#', onClick: (e: Event) => { e.preventDefault(); store.deactivateFinder() } }, 'Home')),
      h('h4', null, h('a', { href: '#', onClick: (e: Event) => { e.preventDefault(); store.activateFinder() } }, 'Finder')),
    ]),
  ])

function onHover(id: string) {
  store.hoverLocation(id)
}

function onHoverEnd() {
  store.hoverLocation(null)
}

function onSelect(location: Location) {
  returnFocusTarget.value = document.activeElement as HTMLElement
  store.selectLocation(location)
}

function onClose(e: MouseEvent) {
  store.clearSelection()
  nextTick(() => returnFocusTarget.value?.focus())
}
</script>

<template>
  <div class="pinboard">
    <AppHeader
      id="pinboard-nav"
      :show-trusted-site="true"
      :mobile-nav="MobileNavContent"
      :links="[]"
      :navbar-brand="{
        brandingImage: { src: '', href: '/', altText: 'City of Philadelphia' },
        brandingLink: { text: config.title, href: '/' },
      }"
    />

    <main class="pinboard-main">
      <div class="finder-panel">

        <div class="finder-panel-locations" :class="{ 'is-active': store.activePanel === 'locations' }">
          <template v-if="store.finderActive">
            <slot name="locations-header" />
            <SearchFilterPanel v-if="isLoaded" :locations="displayLocations" />

            <div v-if="store.state.kind === 'Loading'" class="status-message">
              Loading...
            </div>

            <div v-else-if="store.state.kind === 'Error'" class="status-message status-message--error">
              {{ store.state.kind === 'Error' ? store.state.message : '' }}
            </div>

            <LocationsPanel
              v-else-if="isLoaded"
              :locations="displayLocations"
              :hovered-id="store.hoveredId"
              :selected-id="store.selectedLocationId"
              :location-card-slot="slots['location-card']"
              @select="onSelect"
              @hover="onHover"
              @hover-end="onHoverEnd"
            />
          </template>

          <div v-else class="home-content content">
            <slot name="home" :activate-finder="store.activateFinder" />
          </div>
        </div>

        <div class="finder-panel-map" :class="{ 'is-active': store.activePanel === 'map' }">
          <MapPanel
            v-if="isLoaded"
            :config="config.map"
            :locations="displayLocations"
            :geojson="store.geojson"
            :hovered-id="store.hoveredId"
            :selected-id="store.selectedLocationId"
            :on-hover="onHover"
            :on-hover-end="onHoverEnd"
            :on-select="(loc: unknown) => onSelect(loc as Location)"
            :map-content-slot="slots['map-content']"
          />
        </div>

      </div>
      <button class="mobile-panel-toggle" @click="store.togglePanel">
        {{ store.activePanel === 'locations' ? 'Map view' : 'List view' }}
      </button>

      <div v-show="store.detailOpen" class="detail-overlay">
        <component
          v-if="store.selectedLocation !== null && slots['location-detail']"
          :is="() => slots['location-detail']!({
            location: store.selectedLocation!,
            onClose,
          })"
        />
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

.finder-panel-locations > :deep(.location-list) {
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
