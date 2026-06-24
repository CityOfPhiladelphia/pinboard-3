<script setup lang="ts">
import { PhilaLink } from '@pinboard/ui'
import { IconPhone, IconLocationDot, IconGlobe } from '@phila/phila-ui-core/icons'
import type { PrimaryCareLocation } from '@/types'

defineProps<{
  location: PrimaryCareLocation
}>()

<<<<<<< HEAD
</script>

<template>
  <div class="location-card-content">
    <strong>{{ location.name }}</strong>
    <div v-if="location.address" class="card-address">
      {{ location.address }}
    </div>
    <div v-if="location.med_phone_num" class="card-phone">
      {{ location.med_phone_num }}
=======
function siteName(location: PrimaryCareLocation): string {
  let value = location.properties.record
  if (
    value === 'Delaware Valley Community Health (DVCH) Maria de los Santos Womens Health Center'
  ) {
    value = "Delaware Valley Community Health (DVCH) Maria de los Santos Women's Health Center"
  }
  return value
}

function mapsUrl(location: PrimaryCareLocation): string {
  const { address, address_2, zip_code } = location.properties
  const parts = [address, address_2, zip_code, 'Philadelphia, PA'].filter(Boolean)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
}
</script>

<template>
  <div class="card-content">
    <strong class="card-heading">{{ siteName(location) }}</strong>
    <span v-if="location.locationCardInfo.subheader" class="card-distance">
      {{ location.locationCardInfo.subheader }}
    </span>
    <div class="card-links">
      <PhilaLink
        v-if="location.properties.med_phone_num"
        :href="`tel:${location.properties.med_phone_num}`"
        :icon="IconPhone"
        size="small"
        class="card-link"
        @click.stop
      >
        {{ location.properties.med_phone_num }}
      </PhilaLink>
      <PhilaLink
        v-if="location.properties.address"
        :href="mapsUrl(location)"
        :icon="IconLocationDot"
        size="small"
        target="_blank"
        rel="noopener noreferrer"
        class="card-link"
        @click.stop
      >
        {{ location.properties.address }}
      </PhilaLink>
      <PhilaLink
        v-if="location.properties.website"
        :href="location.properties.website"
        :icon="IconGlobe"
        size="small"
        target="_blank"
        rel="noopener noreferrer"
        class="card-link card-link--full"
        @click.stop
      >
        Provider Website
      </PhilaLink>
>>>>>>> b9b487173b7baa2cfe1194942e215adc54bd4d74
    </div>
  </div>
</template>

<style scoped>
.card-content {
  padding: var(--spacing-m);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-heading {
  font-size: var(--Heading-H5-font-heading-5-size);
  line-height: var(--Heading-H5-font-heading-5-lineheight);
}

.card-distance {
  font-size: 0.875rem;
  color: var(--Schemes-On-Surface-Variant, #666);
}

.card-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  justify-items: start;
  gap: 0.25rem 0.5rem;
  margin-top: 0.25rem;
}

.card-link {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-link :deep(.phila-icon-core) {
  color: var(--Schemes-On-Surface-Low);
}

.card-link--full {
  grid-column: 1 / -1;
}
</style>
