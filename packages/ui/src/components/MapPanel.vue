<script setup lang="ts">
import {
  ref,
  computed,
  defineComponent,
  type ComponentPublicInstance,
} from 'vue'
import { Map as PhilaMap } from '@phila/phila-ui-map-core'
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css'
import type { MapConfig, Location } from '../types'

const props = withDefaults(
  defineProps<{
    config?: MapConfig
    locations?: Location[]
    geojson?: unknown
    hoveredId?: string | null
    selectedId?: string | null
    isLoading?: boolean
    isMobile?: boolean
    onHover?: (id: string) => void
    onHoverEnd?: () => void
    onSelect?: (loc: Location) => void
    mapContentSlot?: (props: {
      locations: Location[]
      geojson: unknown
      map: unknown
      zoom: number
      isMobile: boolean
      hoveredId: string | null
      selectedId: string | null
      onHover: (id: string) => void
      onHoverEnd: () => void
      onSelect: (loc: unknown) => void
    }) => unknown
  }>(),
  {
    isLoading: false,
  }
)

const mapRef = ref<ComponentPublicInstance | null>(null)
const zoom = ref(props.config?.zoom ?? 14)

function panTo(lngLat: [number, number]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = (mapRef.value as any)?.map
  if (mapInstance) {
    mapInstance.setCenter(lngLat)
    mapInstance.setZoom(14)
  }
}

defineExpose({ panTo })

const slotProps = computed(() => ({
  locations: props.locations,
  geojson: props.geojson,
  map: null as unknown,
  zoom: zoom.value,
  isMobile: props.isMobile ?? false,
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
    return (this.renderFn as (props: Record<string, unknown>) => unknown)(
      this.renderProps
    )
  },
})
</script>

<template>
  <div class="map-panel">
    <PhilaMap ref="mapRef" v-bind="config" @zoom="zoom = $event">
      <SlotRenderer
        v-if="mapContentSlot"
        :render-fn="mapContentSlot"
        :render-props="slotProps"
      />
    </PhilaMap>

    <div v-if="isLoading" class="map-loading-overlay">
      <div class="map-loading-spinner" />
      <span class="map-loading-text">Loading data...</span>
    </div>
  </div>
</template>

<style scoped>
.map-panel {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.35);
  z-index: 1;
}

.map-loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #ddd;
  border-top-color: var(--Schemes-Primary, #2176d2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.map-loading-text {
  font-size: 0.875rem;
  color: #555;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
