<script setup lang="ts">
import { computed } from 'vue'
import type { OemLocation } from '@/types'
import GaugeReadings from './GaugeReadings.vue'
import CameraVideoPlayer from './CameraVideoPlayer.vue'
import { useLocationDetail } from '@/composables/useLocationDetail'
import { CloseButton } from '@phila/phila-ui-button'
import { Tags } from "@phila/phila-ui-tags";
import { Icon } from '@phila/phila-ui-core';
import {  
  faGear,
  faWrench
} from '@fortawesome/pro-solid-svg-icons'

const props = defineProps<{
  location: OemLocation
  onClose: () => void
}>()

const readingState = useLocationDetail(
  () => props.location.id,
  () => props.location.deviceType,
)

// we could get gauge height out of location but this updates onWatch with graph
const gaugeHeight = computed(() => {
  if (readingState.value.kind === 'Loaded' && readingState.value.data[0].gaugeHeight !== -9999.9) {
    return `${readingState.value.data[0].gaugeHeight} ${readingState.value.data[0].gaugeHeightUnit}`
  }
  return null
})

const lastUpdatedDate = computed(() => {
  if (readingState.value.kind !== 'Loaded') return 'Loading...'

  const validTime = readingState.value.data[0]?.validTimeUTC
  if (!validTime) return 'No data'

  const date = new Date(validTime)
  if (isNaN(date.getTime())) return 'Invalid date'

  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
})
</script>

<template>
  <div class="location-detail content">
    <div class="detail-header">
      <div style="display: flex; align-items: center; gap: var(--spacing-m);">
        <h4 v-if="location.deviceType === 'Aware' || location.deviceType === 'Usgs'">
          {{ location.name }}
        </h4>
        <h2 v-else-if="location.deviceType === 'Camera'">{{ location.name }}</h2>
        <Tags v-if="gaugeHeight" size="large" color="blue" variant="readonly" :text="gaugeHeight"/>
        
      </div>

      <CloseButton size="small" class="detail-close-btn" @click="onClose" />
    </div>

    <div class="detail-body">
      <template v-if="location.deviceType === 'Aware' || location.deviceType === 'Usgs'">
        <!-- Gauge detail -->
        <GaugeReadings :reading-state="readingState" :location="location" />

        <div class="has-text-label-default" style="padding: var(--spacing-xxl) 0 0 0;">Gauge Information</div>

        <div class="gauge-information" style="padding: var(--spacing-s) 0 0 0;">
          <div> 
            <Icon :iconDefinition="faGear" size="extra-small"/> 
            <div style="margin-left: var(--spacing-s);">
              <div class="has-text-label-small" style="color: #666">Last Updated</div>
              <div class="has-text-body-small">{{ lastUpdatedDate }}</div>
            </div>
          </div>

          <div> 
            <Icon :iconDefinition="faWrench" size="extra-small"/> 
            <div style="margin-left: var(--spacing-s);">
              <div class="has-text-label-small" style="color: #666">Coordinates</div>
              <div class="has-text-body-small">{{ location.latitude }}, {{ location.longitude }}</div>
            </div>
          </div>
        </div>
      </template>

      <!-- this will be part of new Location Detail query on backend -->
      <!-- Camera detail -->
      <template v-else-if="location.deviceType === 'Camera'">
        <p>
          This video camera is located at the intersection of
          {{ location.name }} and allows you to monitor road conditions and potential flooding in
          real time.
        </p>

        <CameraVideoPlayer
          v-if="location.cameraStreamUrl"
          :video-url="location.cameraStreamUrl"
          :autoplay="true"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>

.gauge-information {
  display: grid;
  grid-template-columns: auto auto;
}

.gauge-information > div {
  text-align: left;
  display: flex;
}

.location-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  flex-shrink: 0;
}

.detail-header h2,
.detail-header h4 {
  margin: 0;
  flex: 1;
}

.detail-close-btn {
  flex-shrink: 0;
}

.detail-close-btn :deep(svg) {
  color: var(--Schemes-On-Primary-Container);
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

th,
td {
  border: 1px solid #ddd;
  padding: 0.75rem;
  text-align: left;
}

th {
  background-color: #f5f5f5;
  font-weight: 600;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tr:hover {
  background-color: #f0f0f0;
}
</style>
