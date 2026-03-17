<script setup lang="ts">
import { Pinboard, MapMarker, MapIconTextPin, usePinboardStore } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { faGauge, faCamera } from '@fortawesome/free-solid-svg-icons'
import { useFloodFinderStore } from './stores/floodFinder'
import { gaugeHeights } from './composables/useLocations'
import type { Location } from './types'
import LocationDetail from './components/LocationDetail.vue'

const pinboard = usePinboardStore()
const floodFinder = useFloodFinderStore()

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
  <Pinboard :locations="floodFinder.filteredLocations">
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
          :class="['filter-pill', { active: floodFinder.locationMode === opt.value }]"
          @click="floodFinder.locationMode = opt.value"
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
        v-for="loc in pinboard.allLocations"
        :key="loc.id"
        :lng-lat="[(loc as any).longitude, (loc as any).latitude]"
        :z-index="hoveredId === loc.id || selectedId === loc.id ? 10 : undefined"
      >
        <MapIconTextPin
          :zoom="zoom"
          :icon="isGauge(loc as any) ? faGauge : faCamera"
          :text="isGauge(loc as any) ? gaugeHeights.get(loc.id) : undefined"
          :color-theme="isGauge(loc as any) ? 'dark-primary' : 'dark-error'"
          :hovered="hoveredId === loc.id"
          :selected="selectedId === loc.id"
          :style="floodFinder.filteredLocations.some((f: any) => f.id === loc.id) ? undefined : { visibility: 'hidden', pointerEvents: 'none' }"
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
