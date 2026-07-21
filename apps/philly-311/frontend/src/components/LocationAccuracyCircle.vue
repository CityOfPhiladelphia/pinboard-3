<!-- ABOUTME: Translucent circle at the user's geolocated position, sized from the
     fix's accuracy radius. MapMarker anchors slot content at its bottom edge and
     only reads its `offset` prop once at creation (not reactive), so recentering
     can't go through offset — instead the circle shifts itself down by half its
     own height via a CSS percentage transform, which stays correct at any diameter. -->
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

const diameterPx = computed(
  () => accuracyRadiusPixels(props.accuracy, props.latitude, props.zoom) * 2,
)
</script>

<template>
  <MapMarker :lng-lat="[longitude, latitude]">
    <div
      class="location-accuracy-circle"
      :style="{
        width: `${diameterPx.toFixed(2)}px`,
        height: `${diameterPx.toFixed(2)}px`,
        transform: 'translateY(50%)',
      }"
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
