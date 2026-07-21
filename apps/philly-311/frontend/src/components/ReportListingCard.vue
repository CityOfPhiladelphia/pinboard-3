<!-- ABOUTME: Report listing card for the finder's left panel (Figma ".311 Report listing"):
     photo + service-type title with a status icon chip, address, timestamp. -->
<script setup lang="ts">
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faImage, faCircleCheck, faClock } from '@fortawesome/pro-solid-svg-icons'
import type { Report } from '@/composables/useNearbyReports'
import { statusIconTreatment } from '@/utils/reportCard'
import { formatCardTimestamp } from '@/utils/datetime'

const props = defineProps<{ report: Report }>()

const timestamp = computed(() => formatCardTimestamp(props.report.createdAt))
const statusTreatment = computed(() => statusIconTreatment(props.report.status))
const statusIcon = computed(() => (statusTreatment.value === 'resolved' ? faCircleCheck : faClock))
</script>

<template>
  <article class="listing-card">
    <div class="listing-card__media">
      <img v-if="report.mediaUrl" class="listing-card__photo" :src="report.mediaUrl" alt="" />
      <div v-else class="listing-card__photo listing-card__photo--placeholder">
        <FontAwesomeIcon :icon="faImage" />
      </div>
    </div>
    <div class="listing-card__content">
      <p class="listing-card__title">
        <span class="listing-card__title-text">{{ report.serviceType }}</span>
        <span
          v-if="statusTreatment"
          class="listing-card__status-icon"
          :class="`listing-card__status-icon--${statusTreatment}`"
          role="img"
          :aria-label="report.status"
        >
          <FontAwesomeIcon :icon="statusIcon" aria-hidden="true" />
        </span>
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
  background: var(--ui-color-grey-200, #e3e3e3);
  color: var(--ui-color-grey-400, #a1a1a1);
  font-size: 1.5rem;
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
.listing-card__status-icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 0.75rem;
}
.listing-card__status-icon--resolved {
  background: var(--Schemes-Success-Container, #caecc8);
  color: var(--Schemes-On-Success-Container, #07570f);
}
.listing-card__status-icon--open {
  background: #e5cefa;
  color: #030831;
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
