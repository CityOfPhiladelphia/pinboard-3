<script setup lang="ts">
import type { Location } from '../types'

defineProps<{
  locations: Location[]
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
