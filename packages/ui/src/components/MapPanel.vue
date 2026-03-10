<script setup lang="ts">
// import type { LocationDTO } from '../../../../apps/oem-flood-finder/frontend/src/types'
// import type { Location } from '../types'
import { Map as PhilaMap } from "@phila/phila-ui-map-core";
import "@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css";

// defineProps<{
//   locations: LocationDTO
// }>()
</script>

<template>
  <div class="map-pane">
    <PhilaMap>

    </PhilaMap>
  </div>
</template>

<style scoped>
.map-pane {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>
