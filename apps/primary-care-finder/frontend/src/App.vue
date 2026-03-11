<script setup lang="ts">
import { toRaw } from 'vue'
import { Pinboard, CircleLayer } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css'
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

    <template #map-content="{ geojson, hoveredId, selectedId, onHover, onHoverEnd, onSelect }">
      <CircleLayer
        v-if="geojson"
        id="locations"
        :source="{ type: 'geojson', data: toRaw(geojson) }"
        :paint="{
          'circle-radius': [
            'case',
            ['==', ['get', 'id'], selectedId ?? ''],
            12,
            ['==', ['get', 'id'], hoveredId ?? ''],
            10,
            7,
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'id'], selectedId ?? ''],
            '#0D47A1',
            ['==', ['get', 'id'], hoveredId ?? ''],
            '#1976D2',
            '#1976D2',
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        }"
        @mouseenter="(e: any) => onHover(e.features?.[0]?.properties?.id)"
        @mouseleave="onHoverEnd"
        @click="(e: any) => {
          const feature = e.features?.[0]
          if (!feature) return
          const id = feature.properties?.id
          onSelect({ id, properties: feature.properties, geometry: feature.geometry })
        }"
      />
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
