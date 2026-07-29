<!-- ABOUTME: Report listing card for the finder's left panel (Figma ".311 Report listing"):
     photo + service-type title with a status tag, address, timestamp. -->
<script setup lang="ts">
import { computed } from 'vue'
import { Tags } from '@phila/phila-ui-tags'
import { Icon } from '@phila/phila-ui-core'
import { IconImage, IconCircleCheck, IconClock } from '@phila/phila-ui-core/icons'
import type { Report } from '@/composables/useNearbyReports'
import { statusIconTreatment } from '@/utils/reportCard'
import { formatCardTimestamp } from '@/utils/datetime'

const props = defineProps<{ report: Report }>()

const timestamp = computed(() => formatCardTimestamp(props.report.createdAt))
const statusTreatment = computed(() => statusIconTreatment(props.report.status))
const statusIcon = computed(() =>
  statusTreatment.value === 'resolved' ? IconCircleCheck : IconClock,
)
</script>

<template>
  <article class="listing-card">
    <div class="listing-card__media">
      <img v-if="report.mediaUrl" class="listing-card__photo" :src="report.mediaUrl" alt="" />
      <div v-else class="listing-card__photo listing-card__photo--placeholder">
        <Icon :icon="IconImage" decorative size="extra-small" />
      </div>
    </div>
    <div class="listing-card__content">
      <p class="listing-card__title">
        <span class="listing-card__title-text">{{ report.serviceType }}</span>
        <Tags
          v-if="statusTreatment"
          variant="readonly"
          size="small"
          :color="statusTreatment === 'resolved' ? 'green' : 'purple'"
          :icon="statusIcon"
          :text="report.status"
        />
      </p>
      <p class="listing-card__address">{{ report.address }}</p>
      <p v-if="timestamp" class="listing-card__meta">{{ timestamp }}</p>
    </div>
  </article>
</template>

<style scoped>
.listing-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  background: #fff;
  border-bottom: 1px solid var(--Schemes-Border-low, #ccc);
}
.listing-card__media {
  flex: none;
}
.listing-card__photo {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
}
.listing-card__photo--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--Schemes-Border-low, #e3e3e3);
  color: var(--Schemes-Border, #a1a1a1);
}
.listing-card__content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 4px;
  padding: 1rem 0;
}
.listing-card__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 0;
  font-size: 1rem;
  line-height: 1.5rem;
  font-weight: 600;
  color: #000;
}
.listing-card__title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.listing-card__address {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #000;
}
.listing-card__meta {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1rem;
  color: #636363;
}
</style>
