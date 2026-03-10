<script setup lang="ts">
import type { LocationDTO } from '../../../../apps/oem-flood-finder/frontend/src/types'

defineProps<{
  locations: LocationDTO
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
