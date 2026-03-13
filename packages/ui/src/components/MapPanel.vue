<script setup lang="ts">
import { ref, computed, defineComponent, h, type ComponentPublicInstance } from 'vue'
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
  mapContentSlot?: (props: { locations: unknown; geojson: unknown; map: unknown; zoom: number; hoveredId: string | null; selectedId: string | null; onHover: (id: string) => void; onHoverEnd: () => void; onSelect: (loc: unknown) => void }) => unknown
}>()

const mapRef = ref<ComponentPublicInstance | null>(null)
const zoom = ref(props.config?.zoom ?? 14)

const slotProps = computed(() => ({
  locations: props.locations,
  geojson: props.geojson,
  map: null as unknown,
  zoom: zoom.value,
  hoveredId: props.hoveredId ?? null,
  selectedId: props.selectedId ?? null,
  onHover: props.onHover ?? (() => {}),
  onHoverEnd: props.onHoverEnd ?? (() => {}),
  onSelect: props.onSelect ?? (() => {}),
}))

const SlotRenderer = defineComponent({
  props: {
    renderFn: { type: Function, required: true },
    renderProps: { type: Object, required: true },
  },
  render() {
    return (this.renderFn as Function)(this.renderProps)
  },
})
</script>

<template>
  <div class="map-pane">
    <PhilaMap
      ref="mapRef"
      v-bind="config"
      @zoom="zoom = $event"
    >
      <SlotRenderer
        v-if="mapContentSlot"
        :render-fn="mapContentSlot"
        :render-props="slotProps"
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
