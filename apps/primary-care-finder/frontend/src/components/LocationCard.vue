<script setup lang="ts">
import type { PrimaryCareLocation } from '@/types'

const props = defineProps<{
  location: PrimaryCareLocation
}>()

function siteName(location: PrimaryCareLocation): string {
  let value = location.properties.record
  if (value === 'Delaware Valley Community Health (DVCH) Maria de los Santos Womens Health Center') {
    value = "Delaware Valley Community Health (DVCH) Maria de los Santos Women's Health Center"
  }
  return value
}
</script>

<template>
  <div class="location-card-content">
    <strong>{{ siteName(location) }}</strong>
    <div v-if="location.properties.address" class="card-address">
      {{ location.properties.address }}
    </div>
    <div v-if="location.properties.med_phone_num" class="card-phone">
      {{ location.properties.med_phone_num }}
    </div>
  </div>
</template>

<style scoped>
.location-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.card-address,
.card-phone {
  font-size: 0.875rem;
  color: var(--Schemes-On-Surface-Variant, #666);
}
</style>
