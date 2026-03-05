<script setup lang="ts">
import type { Gauge } from '../types'

defineProps<{
  locations: Gauge[]
}>()
</script>

<template>
  <div class="map-pane">
    <p>Map</p>
  </div>
</template>

<style scoped>
.map-pane {
  width: 100%;
  height: 100%;
}
</style>
