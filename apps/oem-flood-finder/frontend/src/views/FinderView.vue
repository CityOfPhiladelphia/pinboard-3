<script setup lang="ts">
import { ref } from 'vue'
import type { Location } from '../types'
import SearchFilterPane from '../components/SearchFilterPane.vue'
import LocationList from '../components/LocationList.vue'
import MapPane from '../components/MapPane.vue'

// TODO: Fetch locations from the REST endpoint on mount.
//       Set up shared state — either a composable or a Pinia store (team decision).
//       Pass the reactive locations array to each child component.
const locations = ref<Location[]>([])
</script>

<template>
  <div class="finder-panel">
    <div class="finder-panel-locations">
      <SearchFilterPane :locations="locations" />
      <LocationList :locations="locations" />
    </div>

    <div class="finder-panel-map">
      <MapPane :locations="locations" />
    </div>
  </div>
</template>

<style scoped>
.finder-panel {
  display: flex;
  width: 100%;
  height: 100%;
}

.finder-panel-locations {
  display: flex;
  flex-direction: column;
  width: 50%;
  border-right: 1px solid #ccc;
  overflow: hidden;
}

.finder-panel-locations > :deep(.location-list) {
  flex: 1;
  overflow-y: auto;
}

.finder-panel-map {
  width: 50%;
  overflow: hidden;
}
</style>
