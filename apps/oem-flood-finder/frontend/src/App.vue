<script setup lang="ts">
import { Pinboard } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { MapMarker, MapIconTextPin } from '@phila/phila-ui-map-core'
import { faGauge } from '@fortawesome/free-solid-svg-icons'
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
          :icon="faGauge"
          :text="loc.id.slice(0, 8)"
          color-theme="dark-primary"
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
