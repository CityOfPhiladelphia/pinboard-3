<script setup lang="ts">
import { PhilaLink } from '@pinboard/ui'
import { IconPhone, IconLocationDot, IconGlobe } from '@phila/phila-ui-core/icons'
import type { PrimaryCareLocation } from '@/types'
import { formatFullAddress } from '@/utilities/formatAddress'
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
    <span class="card-heading has-text-label-default">{{ location.name }}</span>
    <span v-if="location.locationCardInfo.subheader" class="card-distance">
      {{ location.locationCardInfo.subheader }}
    </span>
    <LocationTags :location="location" class="card-tags" />
    <div class="card-links">
      <div class="card-links-primary">
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
          v-if="location.properties.website"
          :href="location.properties.website"
          :icon="IconGlobe"
          size="small"
          target="_blank"
          rel="noopener noreferrer"
          class="card-link"
          @click.stop
        >
          {{ $t('providerWebsite') }}
        </PhilaLink>
      </div>
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
        {{ formatFullAddress(location.properties) }}
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

.card-distance {
  font-size: 0.875rem;
  color: var(--Schemes-On-Surface-Variant, #666);
}

/* Two columns: the phone + website stack on the left, the address on the right —
   the address wraps within its column and stays there at every width. */
.card-links {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  justify-items: start;
  gap: 0.25rem 0.5rem;
  margin-top: 0.25rem;
}

.card-links-primary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
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

.card-tags {
  margin-top: 0.25rem;
}
</style>
