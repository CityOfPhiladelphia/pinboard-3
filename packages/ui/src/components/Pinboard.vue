<script setup lang="ts">
import '@phila/phila-ui-core/styles/template-light.css'
import { AppFooter } from '@phila/phila-ui-app-footer'
import { AppHeader } from '@phila/phila-ui-app-header'
import { CollapsePanel } from '@phila/phila-ui-collapse-panel'
import { h, ref, computed, nextTick, useSlots, inject, type FunctionalComponent, type Ref } from 'vue'
import { PINBOARD_CONFIG_KEY, type State, type Location } from '../types'
import SearchFilterPanel from './SearchFilterPanel.vue'
import MapPanel from './MapPanel.vue'
import LocationsPanel from './LocationsPanel.vue'

defineSlots<{
  home?(props: { activateFinder: () => void }): unknown
  'location-card'?(props: { location: Location }): unknown
  'location-detail'?(props: { location: Location; onClose: (e: MouseEvent) => void }): unknown
  'map-content'?(props: {
    locations: unknown
    geojson: unknown
    map: unknown
    hoveredId: string | null
    selectedId: string | null
    onHover: (id: string) => void
    onHoverEnd: () => void
    onSelect: (loc: unknown) => void
  }): unknown
}>()

const config = inject(PINBOARD_CONFIG_KEY)!
const slots = useSlots()

const state: Ref<State> = config.useLocations()
const loadedData = computed(() => state.value.kind === 'Loaded' ? state.value.data : undefined)
const loadedGeojson = computed(() => state.value.kind === 'Loaded' ? state.value.geojson : undefined)

const finderActive = ref(false)
const selectedLocation = ref<Location | null>(null)
const returnFocusTarget = ref<HTMLElement | null>(null)
const hoveredId = ref<string | null>(null)
const selectedId = computed(() => selectedLocation.value?.id ?? null)

function activateFinder() {
  finderActive.value = true
}

function deactivateFinder() {
  finderActive.value = false
}

const MobileNavContent: FunctionalComponent = () =>
  h('div', { class: 'content nav-flyout has-background-ghost-gray is-flex is-12 is-12-mobile', tabindex: -1 }, [
    h('div', { class: 'p-4' }, [
      h('h4', null, h('a', { href: '#', onClick: (e: Event) => { e.preventDefault(); deactivateFinder() } }, 'Home')),
      h('h4', null, h('a', { href: '#', onClick: (e: Event) => { e.preventDefault(); activateFinder() } }, 'Finder')),
    ]),
  ])

function onHover(id: string) {
  hoveredId.value = id
}

function onHoverEnd() {
  hoveredId.value = null
}

function onSelect(location: Location, onClickOpen: () => void) {
  returnFocusTarget.value = document.activeElement as HTMLElement
  selectedLocation.value = location
  onClickOpen()
}

function onClose(onClickToggle: (e: Event) => void) {
  return (e: MouseEvent) => {
    onClickToggle(e)
    selectedLocation.value = null
    nextTick(() => returnFocusTarget.value?.focus())
  }
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
      <CollapsePanel id="detail-panel" class="detail-panel-wrapper">
        <template #toggle="{ onClickOpen }">
          <div class="finder-panel">

            <div class="finder-panel-locations">
              <template v-if="finderActive">
                <SearchFilterPanel v-if="loadedData" :locations="loadedData" />

                <div v-if="state.kind === 'Loading'" class="status-message">
                  Loading...
                </div>

                <div v-else-if="state.kind === 'Error'" class="status-message status-message--error">
                  {{ state.message }}
                </div>

                <LocationsPanel
                  v-else-if="loadedData"
                  :locations="loadedData"
                  :hovered-id="hoveredId"
                  :selected-id="selectedId"
                  :location-card-slot="slots['location-card']"
                  @select="(loc) => onSelect(loc, onClickOpen)"
                  @hover="onHover"
                  @hover-end="onHoverEnd"
                />
              </template>

              <div v-else class="home-content content">
                <slot name="home" :activate-finder="activateFinder" />
              </div>
            </div>

            <div class="finder-panel-map">
              <MapPanel
                v-if="loadedData"
                :config="config.map"
                :locations="loadedData"
                :geojson="loadedGeojson"
                :hovered-id="hoveredId"
                :selected-id="selectedId"
                :on-hover="onHover"
                :on-hover-end="onHoverEnd"
                :on-select="(loc: unknown) => onSelect(loc as Location, onClickOpen)"
                :map-content-slot="slots['map-content']"
              />
            </div>

          </div>
        </template>

        <template #default="{ hidden, onClickToggle }">
          <div v-show="!hidden" id="detail-panel" class="detail-overlay">
            <component
              v-if="selectedLocation !== null && slots['location-detail']"
              :is="() => slots['location-detail']!({
                location: selectedLocation!,
                onClose: onClose(onClickToggle),
              })"
            />
          </div>
        </template>
      </CollapsePanel>
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
  flex: 1;
  overflow: hidden;
}

.detail-panel-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
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
</style>
