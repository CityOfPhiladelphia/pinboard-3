<!-- ABOUTME: Report listing card for the finder's left panel (Figma ".311 Report listing"):
     photo + status tag overlay, service icon + type, address, date line, color dot, distance. -->
<script setup lang="ts">
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faImage } from '@fortawesome/pro-solid-svg-icons'
import { Tags } from '@phila/phila-ui-tags'
import type { Report } from '@/composables/useNearbyReports'
import { statusTagColor } from '@/utils/reportCard'
import { serviceTypeIconDefinition } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'
import { formatDistance } from '@/utils/distance'
import { formatCardTimestamp } from '@/utils/datetime'

const props = defineProps<{ report: Report }>()

const timestamp = computed(() => formatCardTimestamp(props.report.createdAt))
const distance = computed(() => formatDistance(props.report.distance))
const typeColor = computed(() => serviceTypeColor(props.report.serviceType))
</script>

<template>
  <article class="listing-card">
    <div class="listing-card__media">
      <img v-if="report.mediaUrl" class="listing-card__photo" :src="report.mediaUrl" alt="" />
      <div v-else class="listing-card__photo listing-card__photo--placeholder">
        <FontAwesomeIcon :icon="faImage" />
      </div>
      <Tags
        v-if="report.status"
        class="listing-card__status"
        :text="report.status"
        :color="statusTagColor(report.status)"
      />
    </div>
    <div class="listing-card__body">
      <p class="listing-card__title">
        <FontAwesomeIcon
          class="listing-card__type-icon"
          :icon="serviceTypeIconDefinition(report.serviceType)"
          :style="{ color: typeColor }"
        />
        {{ report.serviceType }}
      </p>
      <p class="listing-card__address">{{ report.address }}</p>
      <p v-if="timestamp" class="listing-card__meta">{{ timestamp }}</p>
    </div>
    <div class="listing-card__aside">
      <span class="listing-card__dot" :style="{ backgroundColor: typeColor }" />
      <span v-if="distance" class="listing-card__distance">{{ distance }}</span>
    </div>
  </article>
</template>

<style scoped>
.listing-card {
  display: flex;
  gap: var(--spacing-s, 0.75rem);
  background: #fff;
  border-radius: 8px;
  padding: var(--spacing-s, 0.75rem);
}
.listing-card__media {
  position: relative;
  flex: none;
}
.listing-card__photo {
  width: 80px;
  height: 80px;
  border-radius: 6px;
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
.listing-card__status {
  position: absolute;
  top: -8px;
  left: -8px;
}
.listing-card__body {
  flex: 1;
  min-width: 0;
}
.listing-card__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  margin: 0;
}
.listing-card__address {
  margin: 2px 0 0;
}
.listing-card__meta {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
.listing-card__aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  flex: none;
}
.listing-card__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.listing-card__distance {
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
</style>
