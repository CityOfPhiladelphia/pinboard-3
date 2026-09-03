<!-- ABOUTME: Small map thumbnail showing a single labeled pin at a location — centered
     on latitude/longitude, falls back to a plain icon when coordinates are missing.
     Fills whatever box its container gives it; the container controls size/aspect ratio. -->
<script setup lang="ts">
import { computed } from 'vue'
import { Map as PhilaMap, MapMarker, MapIconTextPin } from '@phila/phila-ui-map-core'
import { Icon, type IconComponent } from '@phila/phila-ui-core'
import { IconLocationDot } from '@phila/phila-ui-core/icons'

const props = defineProps<{
  latitude?: number
  longitude?: number
  /** Pin icon, and the fallback icon shown when coordinates are missing. */
  icon?: IconComponent
  /** Pin color. Defaults to MapIconTextPin's own theme color when omitted. */
  color?: string
  zoom?: number
}>()

const hasCoordinates = computed(() => props.latitude != null && props.longitude != null)
const lngLat = computed<[number, number]>(() => [props.longitude ?? 0, props.latitude ?? 0])
const zoom = computed(() => props.zoom ?? 16)
</script>

<template>
  <div class="location-thumbnail">
    <PhilaMap v-if="hasCoordinates" :center="lngLat" :zoom="zoom">
      <MapMarker :lng-lat="lngLat">
        <MapIconTextPin :icon="icon ?? IconLocationDot" :color="color" />
      </MapMarker>
    </PhilaMap>
    <div v-else class="location-thumbnail__placeholder" aria-hidden="true">
      <Icon :icon="icon ?? IconLocationDot" decorative size="large" />
    </div>
  </div>
</template>

<style scoped>
.location-thumbnail {
  /* PhilaMap's root renders position: absolute internally — it needs a positioned
     ancestor to size against, or it silently falls back to sizing against the
     nearest positioned ancestor up the page, ignoring this box's own dimensions. */
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.location-thumbnail__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--Schemes-On-Surface-Low, #636363);
}
</style>
