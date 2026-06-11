<!-- ABOUTME: Location-step map using @phila/phila-ui-map-core (MapLibre). Shows a
     Philly default view until a location exists, then a draggable marker that
     emits move({lat,lng}) on dragend; emits outOfBounds for non-Philly points. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Map as PhilaMap, MapMarker } from '@phila/phila-ui-map-core'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { isInPhilly } from '@/utils/bounds'
import { useMapBounds } from '@/composables/useMapBounds'

const PHILLY_DEFAULT: [number, number] = [-75.163789, 39.952335] // City Hall [lng, lat]

const props = defineProps<{ location: { lat: number; lng: number } | null }>()
const emit = defineEmits<{
  move: [point: { lat: number; lng: number }]
  outOfBounds: []
}>()

interface PhilaMapInstance {
  map: { value: MapLibreMap | null }
  isLoaded: { value: boolean }
}
const philaMap = ref<PhilaMapInstance | null>(null)
useMapBounds(philaMap as never)

const center = computed<[number, number]>(() =>
  props.location ? [props.location.lng, props.location.lat] : PHILLY_DEFAULT,
)
const zoom = computed(() => (props.location ? 16 : 12))

watch(
  () => props.location,
  (loc) => {
    if (!loc) return
    if (!isInPhilly(loc.lat, loc.lng)) emit('outOfBounds')
    // The wrapper only honors :center at mount; recenter the live map ourselves.
    // Keep the user's zoom unless they're zoomed too far out to see the pin.
    const m = philaMap.value?.map?.value
    if (m) m.flyTo({ center: [loc.lng, loc.lat], zoom: Math.max(m.getZoom(), 16) })
  },
  { immediate: true },
)

function onDragEnd(p: { lng: number; lat: number }) {
  emit('move', { lat: p.lat, lng: p.lng })
}
</script>

<template>
  <div class="location-map">
    <PhilaMap ref="philaMap" :center="center" :zoom="zoom">
      <MapMarker
        v-if="location"
        :lngLat="[location.lng, location.lat]"
        draggable
        ariaLabel="Drag to refine the location"
        @dragend="onDragEnd"
      />
    </PhilaMap>
  </div>
</template>

<style scoped>
.location-map {
  width: 100%;
  height: 420px;
  position: relative;
}
.location-map :deep(.map-wrapper),
.location-map :deep(.maplibregl-map) {
  width: 100%;
  height: 100%;
}
</style>
