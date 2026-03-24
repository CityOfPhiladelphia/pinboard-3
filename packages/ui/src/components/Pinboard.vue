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
import {
  faTimes, 
  faBars,   
  faCaretDown,
  faCaretUp,
  faLock,
  faBuildingColumns,
  faClose,
  faInfoCircle, 
} from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

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

    <div class="trusted-banner-and-translations">

      <div class="banner-content">

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
        <!-- Text -->
        <div class="official-text">An official website of the City of Philadelphia government</div>

        <!-- Button -->
        <div class="dropdown-icon">
          <button class="how-you-know-button" @click="() => howYouKnow = !howYouKnow">
            Here's how you know
            <FontAwesomeIcon class="dropdown-arrow" :icon="howYouKnow ? faCaretUp : faCaretDown" />
          </button>
        </div>

      </div>

    </div>

    <div v-if="howYouKnow" class="how-you-know-details">
      <div class="details-container">
        <div class="official-details">
          <div class="official-details-icon-group">

            <span class="icon circle-icon p-3 mb-2">
              <FontAwesomeIcon :icon="faLock" />
            </span>

            <div class="official-details-icon-text">
              https://
            </div>
          </div>

          <div class="official-details-text">
            <p class="official-details-text-description">
              The https:// in the address bar means your information is encrypted and can not be accessed by anyone else
            </p>
          </div>

        </div>

        <div class="official-details">
          <div class="official-details-icon-group">

            <span class="icon circle-icon p-3 mb-2">
              <FontAwesomeIcon :icon="faBuildingColumns" />
            </span>

            <div class="official-details-icon-text">
              .gov
            </div>

          </div>

          <div class="official-details-text">
            <p class="official-details-text-description">
              Only government entities in the U.S. can end in .gov
            </p>
          </div>

        </div>
      </div>
      <button class="official-close-button" @click="() => howYouKnow = false">
        <FontAwesomeIcon :icon="faClose" />
      </button>
    </div>

    <div class="navbar-content">
      <button id="nav-button" @click="() => navOpen = !navOpen"> 
        <FontAwesomeIcon class="nav-burger" :icon="navOpen ? faTimes : faBars" />
      </button>
      <div class="phila-navbar-brand">
        <Logo variant="city" layout="stacked" color-scheme="on-primary" class="phila-navbar-logo" />
      </div>
    </div>

    <div v-if="navOpen">
      <slot name="nav"></slot>
    </div>


    <!-- <AppHeader id="pinboard-nav" :show-trusted-site="true" :mobile-nav="navComponent" :links="[]" :navbar-brand="{
      brandingImage: { src: '', href: '/', altText: 'City of Philadelphia' },
      brandingLink: { text: config.title, href: '/' },
    }" /> -->

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

.official-close-button {
  border: none;
  display: flex;
  width: var(--scale-400, 2rem);
  height: var(--scale-400, 2rem);
  max-width: 18.75rem;
  padding: var(--spacing-xs, 0.5rem);
  justify-content: center;
  align-items: center;
  gap: var(--spacing-xs, 0.5rem);
  flex-shrink: 0;
}

.circle-icon {
  border: solid 1px;
  border-radius: 100%;
  width: 2.5rem;
  height: 2.5rem;
  aspect-ratio: 1/1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.official-details-text-description {
  font-family: var(--Body-Small-font-body-small-family, Montserrat);
  font-size: var(--Body-Small-font-body-small-size, 0.875rem);
  font-style: normal;
  font-weight: 400;
  line-height: var(--Body-Small-font-body-small-lineheight, 1.25rem);
}

.official-details-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-2xs, 0.25rem);
  flex: 1 0 0;
  align-self: stretch;
}

.official-details-icon-text {
  font-family: var(--Label-Default-font-label-default-family, Montserrat);
  font-size: var(--Label-Default-font-label-default-size, 1rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Label-Default-font-label-default-lineheight, 1.5rem); /* 150% */
}

.official-details-icon-group {
  display: flex;
  width: 3.75rem;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs, 0.5rem);
}

.official-details {
  display: flex;
  min-width: 12.4375rem;
  max-width: 31.25rem;
  align-items: flex-start;
  gap: var(--spacing-m, 1rem);
  flex: 1 0 0;
}

.details-container {
  display: flex;
  align-items: flex-start;
  align-content: flex-start;
  gap: 3rem var(--spacing-3xl, 3rem);
  flex: 1 0 0;
  flex-wrap: wrap;
  color: #00008D;
}

.how-you-know-details {
  display: flex;
  padding: var(--spacing-m, 1rem) var(--spacing-l, 1.5rem) var(--spacing-m, 1rem) var(--spacing-xl, 2rem);
  justify-content: space-between;
  align-items: flex-start;
  align-self: stretch;
  background: #EEE7FF;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.5rem);
  flex: 1 0 0;
  align-self: stretch;
}

.official-text {
  color: var(--Schemes-On-Surface-High, #000);

  /* Body/XSmall */
  font-family: var(--Body-ExtraSmall-font-body-xs-family, Montserrat);
  font-size: var(--Body-ExtraSmall-font-body-xs-size, 0.75rem);
  font-style: normal;
  font-weight: 400;
  line-height: var(--Body-ExtraSmall-font-body-xs-lineheight, 1rem); /* 133.333% */
}

.trusted-banner-and-translations {
  display: flex;
  height: 3rem;
  padding: 0 var(--spacing-m, 1rem);
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  background: var(--ghost-grey-700-ghost-grey, #F0F0F0);
}

.dropdown-icon {
  display: flex;
  padding-top: var(--spacing-3xs, 0.125rem);
  align-items: center;
  gap: var(--spacing-3xs, 0.125rem);
}

.dropdown-arrow {
  color: var(--Extended-Colors-link-default, #1034F4);

  /* Icons/Solid/XSmall */
  font-family: var(--Base-font-variables-Family-font-family-icon, "Font Awesome 7 Pro");
  font-size: var(--Icon-Solid-ExtraSmall-font-icon-solid-xs-size, 1rem);
  font-style: normal;
  font-weight: 900;
  line-height: normal;
}

.how-you-know-button {
  overflow: hidden;
  color: var(--Schemes-Primary, #1034F4);
  text-align: center;
  text-overflow: ellipsis;
  border: none;

  /* Label/XSmall */
  font-family: var(--Label-ExtraSmall-font-label-xs-family, Montserrat);
  font-size: var(--Label-ExtraSmall-font-label-xs-size, 0.75rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Label-ExtraSmall-font-label-xs-lineheight, 1rem); /* 133.333% */
}

.phila-navbar-logo {
  padding-left: var(--spacing-xl, 2rem);
  font-size: 1.2rem;
}

.phila-navbar-brand {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.navbar-content {
  display: flex;
  flex-direction: row;
  background: var(--union-blue-200-union-blue, #162B9A);
}

.nav-burger {
  width: 2rem;
  height: 2rem;
}

#nav-button {
  color: var(--Schemes-On-Surface);
  background: var(--flyers-orange-450-flyers-orange, #EC6738);
  width: var(--scale-1000, 5rem);
  height: var(--scale-1000, 5rem);
  border: none;
}

#nav-button:hover {
  background: var(--Schemes-Inverse-Surface, #333);
  color: white
}

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
