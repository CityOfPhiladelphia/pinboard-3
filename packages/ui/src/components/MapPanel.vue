<script setup lang="ts">
import { ref, computed, defineComponent } from 'vue'
import { Map as PhilaMap } from '@phila/phila-ui-map-core'
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css' // shouldn't the style be bundled with the component?
import type { MapConfig, BasicLocation, LatLon } from '../types'

const props = defineProps<{
  config?: MapConfig
  locations?: BasicLocation[]
  geojson?: unknown
  hoveredId?: string | null
  selectedId?: string | null
  isLoading?: string | false
  isMobile?: boolean
  onHover?: (id: string) => void
  onHoverEnd?: () => void
  onSelect?: (loc: BasicLocation) => void
  mobileControlsTarget?: HTMLDivElement | null
  mobileControlsTargetLeft?: HTMLDivElement | null
  mapContentSlot?: (props: {
    locations: BasicLocation[]
    geojson: unknown
    map: unknown
    zoom: number
    isMobile: boolean
    hoveredId: string | null
    selectedId: string | null
    mobileControlsTarget: HTMLDivElement | null
    mobileControlsTargetLeft: HTMLDivElement | null
    onHover: (id: string) => void
    onHoverEnd: () => void
    onSelect: (loc: unknown) => void
  }) => unknown
}>()

const mapRef = ref<typeof PhilaMap | null>(null)
const zoom = ref(props.config?.zoom ?? 14)

function panTo(coordinates: LatLon) {
  const mapInstance = mapRef.value?.map
  if (mapInstance) {
    mapInstance.setCenter([coordinates.longitude, coordinates.latitude])
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
  mobileControlsTarget: props.mobileControlsTarget ?? null,
  mobileControlsTargetLeft: props.mobileControlsTargetLeft ?? null,
  onHover: props.onHover ?? (() => null),
  onHoverEnd: props.onHoverEnd ?? (() => null),
  onSelect: props.onSelect ?? (() => null),
}))

const SlotRenderer = defineComponent({
  props: {
    renderFn: { type: Function, required: true },
    renderProps: { type: Object, required: true },
  },
  render() {
    return (this.renderFn as (props: Record<string, unknown>) => unknown)(this.renderProps)
  },
})
</script>

<template>
  <div class="map-panel">
    <PhilaMap ref="mapRef" v-bind="config" @zoom="zoom = $event">
      <SlotRenderer v-if="mapContentSlot" :render-fn="mapContentSlot" :render-props="slotProps" />
    </PhilaMap>

    <div v-if="isLoading" class="map-loading-overlay">
      <div class="map-loading-spinner" />
      <span class="map-loading-text" v-text="isLoading"></span>
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
  font-family: var(--Body-Default-font-body-default-family);
  font-size: 0.875rem;
  color: #555;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
