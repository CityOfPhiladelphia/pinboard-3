<script setup lang="ts">
import { Pinboard, MapMarker, MapIconTextPin } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { faGauge, faCamera } from '@fortawesome/free-solid-svg-icons'
import { useLocations } from './composables/useLocations'
import type { Location } from './types'
import LocationDetail from './components/LocationDetail.vue'
import { computed, h, ref, type FunctionalComponent } from 'vue'

const { locations, isLoading, errorMessage } = useLocations();

const locationMode = ref<'all' | 'gauges' | 'cameras'>('all')

const view = ref<'home' | 'finder' | 'glossary'>('home')

const filteredLocations = computed(() => {

  if (!isLoading.value && errorMessage.value === null) {

    if (locationMode.value === 'all') {
      return locations.value
    }

    if (locationMode.value === 'gauges') {
      return locations.value.filter((loc) => loc.other.kind==='Aware' || loc.other.kind==='Usgs')
    }

    if (locationMode.value === 'cameras') {
      return locations.value.filter((loc) => loc.other.kind==='Camera')
    }
  } 
    return []
})


function isGauge(loc: Location): boolean {
  return loc.other.kind === 'Aware' || loc.other.kind === 'Usgs'
}

const filterOptions = [
  { value: 'all' as const, label: 'All' },
  { value: 'gauges' as const, label: 'Gauge' },
  { value: 'cameras' as const, label: 'Camera' },
]

const mobileNavContent: FunctionalComponent = () =>
  h('div', { class: 'content nav-flyout has-background-ghost-gray is-flex is-12 is-12-mobile', tabindex: -1 }, [
    h('div', { class: 'p-4' }, [
      h('h4', null, h('a', { href: '#', onClick: (e: Event) => { e.preventDefault(); } }, 'Home' )),
      h('h4', null, h('a', { href: '#', onClick: (e: Event) => { e.preventDefault(); } }, 'Finder' )),
      h('h4', null, h('a', { href: '#', onClick: (e: Event) => { e.preventDefault(); } }, 'Glossary'))
    ]),
  ])


</script>

<template>
  <!-- <h1>{{ view }}</h1> -->
  <Pinboard 
    :locations="filteredLocations" 
    :get-id="(loc: Location) => loc.id"
    :is-loading="isLoading"
    :error-message="errorMessage"
    :nav-component="mobileNavContent"
    :override="view === 'home' || view === 'glossary'"
  >
    <template #location-override>

      <div v-if="view === 'home'">
        <h3>Eastwick Flood Mapping</h3>
        <p>
          The Eastwick flood mapping application provides real-time data from water gauges and cameras
          in the Eastwick neighborhood. Residents can use this tool to monitor current flood conditions.
          The data can help residents make informed decisions to protect their homes and families. The
          app also provides historical flood data, which can help residents understand long-term trends.
          The City of Philadelphia is committed to providing residents with the resources they need to
          stay safe during flooding events. The Eastwick flood mapping application provides real-time
          data from water gauges and cameras in the Eastwick neighborhood. Residents can use this tool
          to monitor current flood conditions. The data can help residents make informed decisions to
          protect their homes and families.
        </p>
        <PhilaButton text="View List" @click="() => view = 'finder'" />
      </div>

      <div v-if="view === 'glossary'">
        Flood: when gauge height passes flood threshold.
      </div>
    </template>

    <template #nav>
      <ul>
        <li> <button @click="() => view = 'home'"> Home </button> </li>
        <li> <button @click="() => view = 'finder'"> Finder </button> </li>
        <li> <button @click="() => view = 'glossary'"> Glossary </button> </li>
      </ul>
    </template>

    <template #locations-header>
      <div class="location-filters">
        <button
          v-for="opt in filterOptions"
          :key="opt.value"
          :class="['filter-pill', { active: locationMode === opt.value }]"
          @click="locationMode = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </template>

    <template #location-card="{ location }">
      {{ location.name }}
    </template>

    <template #location-detail="{ location }">
      <LocationDetail
        :location="location"
      />
    </template>

    <template #map-content="{ hoveredId, selectedId, zoom, onHover, onHoverEnd, onSelect }">
      <MapMarker
        v-if="!isLoading"
        v-for="loc in locations"
        :key="loc.id"
        :lng-lat="[(loc).longitude, (loc).latitude]"
        :z-index="hoveredId === loc.id || selectedId === loc.id ? 10 : undefined"
      >
        <MapIconTextPin
          :zoom="zoom"
          :icon="isGauge(loc) ? faGauge : faCamera"
          :color-theme="isGauge(loc) ? 'dark-primary' : 'dark-error'"
          :hovered="hoveredId === loc.id"
          :selected="selectedId === loc.id"
          :style="filteredLocations.some((f) => f.id === loc.id) ? undefined : { visibility: 'hidden', pointerEvents: 'none' }"
          @mouseenter="onHover(loc.id)"
          @mouseleave="onHoverEnd()"
          @click="onSelect(loc)"
        />
      </MapMarker>
    </template>
  </Pinboard>
</template>

<style>

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>

<style scoped>
.location-filters {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  flex-shrink: 0;
}

.filter-pill {
  padding: 0.375rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 1rem;
  background: #fff;
  cursor: pointer;
  font-size: 0.8125rem;
}

.filter-pill.active {
  background: var(--Schemes-Primary, #2176d2);
  border-color: var(--Schemes-Primary, #2176d2);
  color: #fff;
}

</style>
