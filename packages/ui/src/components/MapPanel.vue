<script setup lang="ts" generic="PinboardLocation">
import { ref, computed, defineComponent } from 'vue'
import { Map as PhilaMap } from '@phila/phila-ui-map-core'
// map-core ships a single combined stylesheet instead of injecting CSS per
// component (libInjectCss is disabled there, because it extracted maplibre's CSS
// into component chunks). This one file bundles every map-core component's styles
// plus maplibre's own CSS, so importing it once here is required and covers it all.
import '@phila/phila-ui-map-core/dist/assets/phila-ui-map-core.css'
import type { MapConfig, LatLon, MapBounds } from '../types'

/** Structural subset of maplibre-gl's LngLatBounds - avoids depending on maplibre-gl directly for types. */
interface BoundsLike {
  getWest: () => number
  getSouth: () => number
  getEast: () => number
  getNorth: () => number
}

function toMapBounds(bounds: BoundsLike): MapBounds {
  return {
    west: bounds.getWest(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    north: bounds.getNorth(),
  }
}

const props = defineProps<{
  config?: MapConfig
  locations?: PinboardLocation[]
  geojson?: unknown
  hoveredId?: string | null
  selectedId?: string | null
  isLoading?: string | false
  isMobile?: boolean
  onHover?: (id: string) => void
  onHoverEnd?: () => void
  onSelect?: (loc: PinboardLocation) => void
  onBoundsChange?: (bounds: MapBounds) => void
  mobileControlsTarget?: HTMLDivElement | null
  mobileControlsTargetLeft?: HTMLDivElement | null
  mapContentSlot?: (props: {
    locations: PinboardLocation[]
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

// The underlying maplibre instance exposed by the <Map> component, once loaded.
const liveMap = computed(() => mapRef.value?.map ?? null)

function panTo(coordinates: LatLon) {
  const mapInstance = liveMap.value
  if (mapInstance) {
    mapInstance.setCenter([coordinates.longitude, coordinates.latitude])
    mapInstance.setZoom(14)
  }
}

defineExpose({ panTo })

function handleMapLoad(mapInstance: { getBounds: () => BoundsLike }) {
  props.onBoundsChange?.(toMapBounds(mapInstance.getBounds()))
}

function handleMoveEnd(data: { bounds: MapBounds }) {
  props.onBoundsChange?.(data.bounds)
}

const slotProps = computed(() => ({
  locations: props.locations,
  geojson: props.geojson,
  map: liveMap.value,
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
    <PhilaMap
      ref="mapRef"
      v-bind="config"
      @zoom="zoom = $event"
      @load="handleMapLoad"
      @moveend="handleMoveEnd"
    >
      <SlotRenderer v-if="mapContentSlot" :render-fn="mapContentSlot" :render-props="slotProps" />
    </PhilaMap>

    <div v-if="isLoading" class="map-loading-overlay">
      <div class="map-loading-spinner" />
      <span class="map-loading-text" v-text="isLoading" />
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
