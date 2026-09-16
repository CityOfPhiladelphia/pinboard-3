<!-- ABOUTME: Location-step map using @phila/phila-ui-map-core (MapLibre). Shows a
     Philly default view until a location exists, then a draggable marker that
     emits move({lat,lng}) on dragend; emits outOfBounds for non-Philly points. -->
<script setup lang="ts">
import { IconLocationDot } from '@phila/phila-ui-core/icons'
import { Icon } from '@phila/phila-ui-core'
import type { AisFeature } from '@/types/wizard'

defineProps<{
  popupText: string
  address: AisFeature
  imgSrc?: string
  showCityZip?: boolean
}>()
</script>

<template>
  <div class="location-image-card">
    <Icon
      class="location-image-card__icon"
      :icon="IconLocationDot"
      size="small"
      decorative
      inline
    />
    <header
      class="location-image-card__street has-text-label-default"
      v-text="address.streetAddress"
    />
    <span
      class="location-image-card__cityzip has-text-body-default"
      v-text="showCityZip ? `Philadelphia, PA ${address.zipCode}` : ' '"
    />
    <span class="location-image-card__source has-text-body-small" v-text="popupText" />
    <div class="location-image-card__image" :style="{ 'background-image': `url(${imgSrc})` }" />
  </div>
</template>

<style scoped>
.location-image-card {
  display: grid;
  grid-template-areas:
    'icon street image'
    'empty cityzip image'
    'empty source image';
  grid-template-columns: 2ch 2fr 1fr;
  grid-template-rows: auto minmax(1ch, auto) auto;
  column-gap: var(--spacing-xs, 0.5rem);
}

.location-image-card__icon {
  grid-area: icon;
}

.location-image-card__street {
  grid-area: street;
}

.location-image-card__cityzip {
  grid-area: cityzip;
}

.location-image-card__source {
  grid-area: source;
}

.location-image-card__image {
  grid-area: image;
  background-size: cover;
  border-radius: var(--border-radius-s, 0.5rem);
}
</style>
