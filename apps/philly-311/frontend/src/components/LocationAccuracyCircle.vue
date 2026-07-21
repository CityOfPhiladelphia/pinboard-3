<!-- ABOUTME: Translucent circle at the user's geolocated position, sized from the
     fix's accuracy radius. MapMarker anchors slot content at its bottom edge, so
     the marker is offset down by the pixel radius to recenter the circle on the
     fix instead of pointing at it like a pin. -->
<script setup lang="ts">
import { computed } from 'vue'
import { MapMarker } from '@pinboard/ui'
import { accuracyRadiusPixels } from '@/utils/geoAccuracy'

const props = defineProps<{
  latitude: number
  longitude: number
  accuracy: number
  zoom: number
}>()

const radiusPx = computed(() => accuracyRadiusPixels(props.accuracy, props.latitude, props.zoom))
const diameterPx = computed(() => radiusPx.value * 2)
</script>

<template>
  <MapMarker :lng-lat="[longitude, latitude]" :offset="[0, radiusPx]">
    <div
      class="location-accuracy-circle"
      :style="{ width: `${diameterPx.toFixed(2)}px`, height: `${diameterPx.toFixed(2)}px` }"
    />
  </MapMarker>
</template>

<style scoped>
.location-accuracy-circle {
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-primary, #0f4d90) 20%, transparent);
  border: 1px solid var(--color-primary, #0f4d90);
}
</style>
