<script setup lang="ts">
import type { Location } from '../types'
// import { Map as PhilaMap } from "@phila/phila-ui-map-core";
import { Map as PhilaMap } from "../../../../../../phila-ui-4/packages/map-core/dist";

defineProps<{
  locations: Location[]
}>()
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
}
</style>
