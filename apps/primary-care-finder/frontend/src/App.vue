<script setup lang="ts">
import { toRaw } from 'vue'
import { Pinboard, PinboardShell, CircleLayer } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { useLocations } from './composables/useLocations'
import LocationCard from './components/LocationCard.vue'
import LocationDetail from './components/LocationDetail.vue'
import type { PrimaryCareLocation } from './types'

const { locations, isLoading, errorMessage, geojson } = useLocations()

function getCardDetails(loc: { name: string; [key: string]: unknown }) {
  return { heading: loc.name, isLoading: false }
}
</script>

<template>
  <PinboardShell title="Primary Care Finder">
    <Pinboard
      :locations="locations"
      :get-card-details="getCardDetails"
      :is-loading="isLoading"
      :error-message="errorMessage"
      :location-filter="null"
      :search="null"
      :geojson="geojson"
    >
      <template #location-card="{ location }">
        <LocationCard :location="location as PrimaryCareLocation" />
      </template>

      <template #location-detail="{ location }">
        <LocationDetail :location="location as PrimaryCareLocation" />
      </template>

      <template
        #map-content="{
          geojson,
          hoveredId,
          selectedId,
          onHover,
          onHoverEnd,
          onSelect,
        }"
      >
        <CircleLayer
          v-if="geojson"
          id="locations"
          :source="{ type: 'geojson', data: toRaw(geojson) as any }"
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
          @click="
            (e: any) => {
              const feature = e.features?.[0]
              if (!feature) return
              const loc = locations.find((l) => l.id === feature.properties?.id)
              if (loc) onSelect(loc)
            }
          "
        />
      </template>
    </Pinboard>
  </PinboardShell>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
