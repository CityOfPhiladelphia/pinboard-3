<script setup lang="ts">
import { Map as PhilaMap } from '@phila/phila-ui-map-core'
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css'
import type { MapConfig } from '../types'

const props = defineProps<{
  config?: MapConfig
  locations?: unknown
  geojson?: unknown
  hoveredId?: string | null
  selectedId?: string | null
  onHover?: (id: string) => void
  onHoverEnd?: () => void
  onSelect?: (loc: unknown) => void
  mapContentSlot?: (props: { locations: unknown; geojson: unknown; map: unknown; hoveredId: string | null; selectedId: string | null; onHover: (id: string) => void; onHoverEnd: () => void; onSelect: (loc: unknown) => void }) => unknown
}>()
</script>

<template>
  <div class="map-pane">
    <PhilaMap
      v-bind="config"
    >
      <component
        v-if="mapContentSlot"
        :is="() => mapContentSlot!({ locations, geojson, map: null, hoveredId: hoveredId ?? null, selectedId: selectedId ?? null, onHover: onHover ?? (() => {}), onHoverEnd: onHoverEnd ?? (() => {}), onSelect: onSelect ?? (() => {}) })"
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
