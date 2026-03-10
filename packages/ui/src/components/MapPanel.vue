<script setup lang="ts">
import { Map as PhilaMap } from '@phila/phila-ui-map-core'
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css'
import type { MapConfig } from '../types'

const props = defineProps<{
  config?: MapConfig
  locations?: unknown
  mapContentSlot?: (props: { locations: unknown; map: unknown }) => unknown
}>()
</script>

<template>
  <div class="map-pane">
    <PhilaMap
      v-bind="config"
    >
      <component
        v-if="mapContentSlot"
        :is="() => mapContentSlot!({ locations, map: null })"
      />
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
