<script setup lang="ts">
import type { PrimaryCareLocation } from '@/types'

defineProps<{
  location: PrimaryCareLocation
}>()

</script>

<template>
  <div class="location-card-content">
    <strong>{{ location.name }}</strong>
    <div v-if="location.address" class="card-address">
      {{ location.address }}
    </div>
    <div v-if="location.med_phone_num" class="card-phone">
      {{ location.med_phone_num }}
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
