<script setup lang="ts">
import { Pinboard } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css'
import { MapMarker } from '@phila/phila-ui-map-core'
import HomeContent from './components/HomeContent.vue'
import LocationCard from './components/LocationCard.vue'
import LocationDetail from './components/LocationDetail.vue'
import type { PrimaryCareLocation } from './types'
</script>

<template>
  <Pinboard>
    <template #home>
      <HomeContent />
    </template>

    <template #location-card="{ location }">
      <LocationCard :location="location as PrimaryCareLocation" />
    </template>

    <template #location-detail="{ location, onClose }">
      <LocationDetail
        :location="location as PrimaryCareLocation"
        :on-close="onClose"
      />
    </template>

    <template #map-content="{ locations, hoveredId, selectedId, onHover, onHoverEnd, onSelect }">
      <MapMarker
        v-for="loc in (locations as PrimaryCareLocation[])"
        :key="loc.id"
        :lng-lat="[loc.geometry.coordinates[0], loc.geometry.coordinates[1]]"
        :z-index="hoveredId === loc.id || selectedId === loc.id ? 10 : undefined"
      >
        <div
          class="map-pin"
          :class="{
            'map-pin--hovered': hoveredId === loc.id,
            'map-pin--selected': selectedId === loc.id,
          }"
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

.map-pin {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: #2176d2;
  border: 1px solid white;
  cursor: pointer;
}

.map-pin--hovered {
  background-color: #0d47a1;
  transform: scale(1.3);
}

.map-pin--selected {
  background-color: #0d47a1;
  border: 2px solid white;
  transform: scale(1.5);
}
</style>
