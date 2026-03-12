<script setup lang="ts">
import { Pinboard } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { MapMarker, MapIconTextPin } from '@phila/phila-ui-map-core'
import { faGauge, faCamera } from '@fortawesome/free-solid-svg-icons'
import { locationMode } from './composables/useLocations'
import LocationDetail from './components/LocationDetail.vue'
</script>

<template>
  <Pinboard>
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
      <div class="location-tabs" role="tablist">
        <button
          role="tab"
          :aria-selected="locationMode === 'gauges'"
          :class="{ active: locationMode === 'gauges' }"
          @click="locationMode = 'gauges'"
        >
          Gauges
        </button>
        <button
          role="tab"
          :aria-selected="locationMode === 'cameras'"
          :class="{ active: locationMode === 'cameras' }"
          @click="locationMode = 'cameras'"
        >
          Cameras
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

    <template #map-content="{ locations, hoveredId, selectedId, onHover, onHoverEnd, onSelect }">
      <MapMarker
        v-for="loc in locations"
        :key="loc.id"
        :lng-lat="[loc.longitude, loc.latitude]"
        :z-index="hoveredId === loc.id || selectedId === loc.id ? 10 : undefined"
      >
        <MapIconTextPin
          :icon="locationMode === 'gauges' ? faGauge : faCamera"
          :text="locationMode === 'gauges' ? loc.id.slice(0, 8) : undefined"
          :color-theme="locationMode === 'gauges' ? 'dark-primary' : 'dark-error'"
          :hovered="hoveredId === loc.id"
          :selected="selectedId === loc.id"
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
.location-tabs {
  display: flex;
  border-bottom: 1px solid #ccc;
  flex-shrink: 0;
}

.location-tabs button {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: normal;
}

.location-tabs button.active {
  font-weight: bold;
  border-bottom-color: var(--Schemes-Primary, #2176d2);
}
</style>
