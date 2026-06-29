<script setup lang="ts">
import { PhilaLink } from '@pinboard/ui'
import { IconPhone, IconLocationDot, IconGlobe } from '@phila/phila-ui-core/icons'
import type { PrimaryCareLocation } from '@/types'
import LocationTags from './LocationTags.vue'

defineProps<{
  location: PrimaryCareLocation
}>()

function mapsUrl(location: PrimaryCareLocation): string {
  const { address, address_2, zip_code } = location.properties
  const parts = [address, address_2, zip_code, 'Philadelphia, PA'].filter(Boolean)
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', '))}`
}
</script>

<template>
  <div class="card-content">
    <strong class="card-heading">{{ location.name }}</strong>
    <span v-if="location.locationCardInfo.subheader" class="card-distance">
      {{ location.locationCardInfo.subheader }}
    </span>
    <LocationTags :location="location" class="card-tags" />
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
        {{ $t('providerWebsite') }}
      </PhilaLink>
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

/* The link is a flex row (.phila-link). min-width:0 lets the grid column shrink and
   flex-start keeps the icon at the top once the text wraps to a second line. */
.card-link {
  min-width: 0;
  align-items: flex-start;
}

/* Let the link's text (the unclassed span ActionContent renders) wrap within its
   column instead of forcing the column wider. */
.card-link :deep(span:not(.phila-icon-core)) {
  min-width: 0;
  overflow-wrap: anywhere;
}

.card-link :deep(.phila-icon-core) {
  color: var(--Schemes-On-Surface-Low);
  flex-shrink: 0;
}

.card-link--full {
  grid-column: 1 / -1;
}

/* Mobile: stack the links so each gets its own full-width line — the address then
   has the whole card width instead of half. */
@media (max-width: 768px) {
  .card-links {
    grid-template-columns: 1fr;
  }
}

.card-tags {
  margin-top: 0.25rem;
}
</style>
