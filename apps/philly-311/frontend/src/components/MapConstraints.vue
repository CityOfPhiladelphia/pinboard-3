<!-- ABOUTME: Render-nothing component that constrains a MapLibre instance to Philadelphia
     by calling setMaxBounds and setMinZoom once the map prop is available. -->
<script setup lang="ts">
import { watch } from 'vue'
import { PHILLY_MAP_BOUNDS } from '@/composables/useMapBounds'

interface BoundedMap {
  setMaxBounds: (b: [[number, number], [number, number]]) => void
  setMinZoom: (z: number) => void
}

const props = defineProps<{ map: unknown }>()

watch(
  () => props.map,
  (m) => {
    if (m) {
      const map = m as BoundedMap
      map.setMaxBounds(PHILLY_MAP_BOUNDS)
      map.setMinZoom(10.5)
    }
  },
  { immediate: true },
)
</script>

<template></template>
