<!-- ABOUTME: Location-step map using @phila/phila-ui-map-core (MapLibre). Shows a
     Philly default view until a location exists, then a draggable marker that
     emits move({lat,lng}) on dragend; emits outOfBounds for non-Philly points. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Map as PhilaMap, MapMarker, MapPopup } from '@phila/phila-ui-map-core'
import { MapIconTextPin } from '@pinboard/ui'
import { useMapBounds, type MapVMComponent } from '@/composables/useMapBounds'
import { serviceTypeIconComponent } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'
import type { Service } from '@/types/app'
import LocationImageCard from './LocationImageCard.vue'
import type { AisFeature } from '@/types/wizard.ts'

const PHILLY_DEFAULT: [number, number] = [-75.163789, 39.952335] // City Hall [lng, lat]

const props = defineProps<{
  location?: { lat: number; lng: number }
  popupText?: string
  serviceType?: Service
  address?: AisFeature
  imgSrc?: string
}>()

const emit = defineEmits<{
  move: [point: { lat: number; lng: number }]
  outOfBounds: []
}>()

const showPopup = ref(true)
const draggingPin = ref(false)
const philaMap = ref<MapVMComponent | null>(null)
useMapBounds(philaMap)

const center = computed<[number, number]>(() =>
  props.location ? [props.location.lng, props.location.lat] : PHILLY_DEFAULT,
)
const zoom = computed(() => (props.location ? 16 : 12))

function onDragStart() {
  draggingPin.value = true
}

function onDragEnd(p: { lng: number; lat: number }) {
  showPopup.value = true
  draggingPin.value = false
  emit('move', { lat: p.lat, lng: p.lng })
}

function togglePopup() {
  showPopup.value = !showPopup.value
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
        @dragstart="onDragStart"
        @dragend="onDragEnd"
      >
        <MapIconTextPin
          :zoom="zoom"
          :icon="serviceTypeIconComponent(serviceType)"
          :color="serviceTypeColor(serviceType)"
          @click="togglePopup"
        />
      </MapMarker>
      <MapPopup
        v-if="location && showPopup && !draggingPin"
        :lng-lat="[location.lng, location.lat]"
        :close-on-click="false"
        :close-button="false"
        :anchor="'left'"
        :offset="[30, -34]"
        max-width="21.25rem"
      >
        <LocationImageCard
          v-if="popupText && address"
          :popup-text="popupText"
          :address="address"
          :img-src="imgSrc"
        />
      </MapPopup>
    </PhilaMap>
  </div>
</template>

<style scoped>
.location-map {
  isolation: isolate;
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
</style>
