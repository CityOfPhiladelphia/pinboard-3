<script setup lang="ts">
import { Pinboard, MapMarker, MapIconTextPin } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { faGauge, faCamera } from '@fortawesome/free-solid-svg-icons'
import { useLocations } from './composables/useLocations'
import type { Location } from './types'
import LocationDetail from './components/LocationDetail.vue'
import { computed, ref } from 'vue'

const locationsState = useLocations();

const locationMode = ref<'all' | 'gauges' | 'cameras'>('all')

const filteredLocations = computed(() => {
  if (locationMode.value === 'all' && locationsState.value.kind === 'Loaded') {
    return locationsState.value.data
  }

  if (locationMode.value === 'gauges' && locationsState.value.kind === 'Loaded') {
    return locationsState.value.data.filter((loc) => loc.other.kind==='Aware' || loc.other.kind==='Usgs')
  }

  if (locationMode.value === 'cameras' && locationsState.value.kind === 'Loaded') {
    return locationsState.value.data.filter((loc) => loc.other.kind==='Camera')
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
</script>

<template>
  <Pinboard :locations="filteredLocations">
    <template #home="{ activateFinder }">
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
      <PhilaButton text="View List" @click="activateFinder" />
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

    <template #location-detail="{ location, onClose }">
      <LocationDetail
        :location="location"
        :on-close="onClose"
      />
    </template>

    <template #map-content="{ hoveredId, selectedId, zoom, onHover, onHoverEnd, onSelect }">
      <MapMarker
        v-if="locationsState.kind==='Loaded'"
        v-for="loc in locationsState.data"
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
