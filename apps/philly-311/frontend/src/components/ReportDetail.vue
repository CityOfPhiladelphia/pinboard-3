<!-- ABOUTME: Inline detail for a selected 311 report in Pinboard's location-detail slot:
     photo, status, service type, address, time, description. -->
<script setup lang="ts">
import { CloseButton } from '@phila/phila-ui-button'
import type { Report } from '@/composables/useNearbyReports'

defineProps<{ report: Report; onClose: () => void }>()

function formatWhen(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-US', { timeZone: 'America/New_York' })
}
</script>

<template>
  <div class="report-detail">
    <CloseButton class="report-detail__close" @click="onClose" />
    <img
      v-if="report.mediaUrl"
      :src="report.mediaUrl"
      :alt="report.serviceType"
      class="report-detail__img"
    />
    <div v-else class="report-detail__img report-detail__img--placeholder" aria-hidden="true" />
    <h2 class="has-text-heading-5">{{ report.serviceType }}</h2>
    <p class="report-detail__status">{{ report.status }}</p>
    <p class="report-detail__address">{{ report.address }}</p>
    <p v-if="report.createdAt" class="report-detail__time">{{ formatWhen(report.createdAt) }}</p>
    <p v-if="report.description" class="report-detail__desc">{{ report.description }}</p>
  </div>
</template>

<style scoped>
.report-detail {
  position: relative;
  padding: var(--spacing-m, 1rem);
}
.report-detail__close {
  position: absolute;
  top: 8px;
  right: 8px;
}
.report-detail__img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  border-radius: 6px;
}
.report-detail__img--placeholder {
  background: var(--ui-color-grey-200, #e5e5e5);
}
.report-detail h2 {
  margin: var(--spacing-s, 0.5rem) 0;
}
</style>
