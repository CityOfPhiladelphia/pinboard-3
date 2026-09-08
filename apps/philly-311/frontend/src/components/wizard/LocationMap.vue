<!-- ABOUTME: Location-step map using @phila/phila-ui-map-core (MapLibre). Shows a
     Philly default view until a location exists, then a draggable marker that
     emits move({lat,lng}) on dragend; emits outOfBounds for non-Philly points. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Map as PhilaMap, MapMarker, MapPopup } from '@phila/phila-ui-map-core'
import { MapIconTextPin } from '@pinboard/ui'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { isInPhilly } from '@/utils/bounds'
import { readExposed, useMapBounds, type MapVMComponent } from '@/composables/useMapBounds'
import { IconLocationDot } from '@phila/phila-ui-core/icons'
import { Icon } from '@phila/phila-ui-core'
import { serviceTypeIconComponent } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'
import type { Service } from '@/types/app'

const PHILLY_DEFAULT: [number, number] = [-75.163789, 39.952335] // City Hall [lng, lat]

const props = defineProps<{
  location?: { lat: number; lng: number }
  name?: Service
  address?: string
  imgSrc?: string
}>()
const emit = defineEmits<{
  move: [point: { lat: number; lng: number }]
  outOfBounds: []
}>()

const philaMap = ref<MapVMComponent | null>(null)
useMapBounds(philaMap)

const center = computed<[number, number]>(() =>
  props.location ? [props.location.lng, props.location.lat] : PHILLY_DEFAULT,
)
const zoom = computed(() => (props.location ? 16 : 12))

watch(
  () => props.location,
  (loc) => {
    if (!loc) return
    if (!isInPhilly(loc.lat, loc.lng)) emit('outOfBounds')
    // The wrapper only honors :center at mount; recenter the live map ourselves.
    // Keep the user's zoom unless they're zoomed too far out to see the pin.
    const m = readExposed<MapLibreMap>(philaMap.value?.map)
    if (m) m.flyTo({ center: [loc.lng, loc.lat], zoom: Math.max(m.getZoom(), 16) })
  },
  { immediate: true },
)

function onDragEnd(p: { lng: number; lat: number }) {
  emit('move', { lat: p.lat, lng: p.lng })
}
</script>

<template>
  <div class="location-map">
    <PhilaMap ref="philaMap" :center="center" :zoom="zoom">
      <MapMarker
        v-if="location"
        :lng-lat="[location.lng, location.lat]"
        draggable
        aria-label="Drag to refine the location"
        @dragend="onDragEnd"
      >
        <MapIconTextPin
          :zoom="zoom"
          :icon="serviceTypeIconComponent(name)"
          :color="serviceTypeColor(name)"
        />
      </MapMarker>
      <MapPopup
        v-if="location"
        :lng-lat="[location.lng, location.lat]"
        :close-on-click="false"
        :close-button="false"
        :anchor="'left'"
        :offset="[30, -34]"
        max-width="21.25rem"
      >
        <div class="location-map__popup-content">
          <header>
            <Icon class="location-map__popup-icon" :icon="IconLocationDot" size="small" />
            <p class="location-map__popup-title" v-text="address" />
          </header>
          <p class="location-map__popup-subheader">Possible address from photo</p>
          <div
            class="location-map__popup-image"
            :style="{ 'background-image': `url(${imgSrc})` }"
          />
        </div>
      </MapPopup>
    </PhilaMap>
  </div>
</template>

<style scoped>
.location-map {
  width: 100%;
  height: 100%;
}

/* disabled lint check because linter has no way of detecting classes of imported PhilaMap component */
/* eslint-disable-next-line vue-scoped-css/no-unused-selector */
.location-map > .map-wrapper {
  position: static;
}

.location-map :is(.maplibregl-popup-content) {
  width: 21rem !important;
}

.location-map__popup-content {
  display: grid;
  grid-template-columns: 2ch 1.5fr 1fr;
  grid-template-rows: auto auto;
  column-gap: 0.5ch;
}

.location-map__popup-content > header {
  display: grid;
  grid-column: 1 / 3;
  grid-row: 1;
  grid-template-columns: subgrid;
  align-items: center;
}

.location-map__popup-icon {
  display: grid;
  grid-column: 1;
  justify-self: center;
}

.location-map__popup-title {
  grid-column: 2;
  color: var(--Schemes-On-Surface-High, #000);

  /* Heading/H6 */
  font-family: var(--Heading-H6-font-heading-6-family, Montserrat);
  font-size: var(--Heading-H6-font-heading-6-size, 1rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Heading-H6-font-heading-6-lineheight, 1.5rem);
}

.location-map__popup-content > header :is(.location-map__popup-title) {
  margin-bottom: 0;
}

.location-map__popup-subheader {
  grid-column: 1 / 3;
  grid-row: 2;
  color: var(--Schemes-On-Surface-High, #000);

  /* Body/Small */
  font-family: var(--Body-Small-font-body-small-family, Montserrat);
  font-size: var(--Body-Small-font-body-small-size, 0.875rem);
  font-style: normal;
  font-weight: 400;
  line-height: var(--Body-Small-font-body-small-lineheight, 1.25rem); /* 142.857% */
}

.location-map__popup-image {
  grid-column: 3;
  grid-row: 1 / -1;
  background-size: cover;
  border-radius: var(--border-radius-s, 0.5rem);
}
</style>
