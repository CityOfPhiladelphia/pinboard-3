<script setup lang="ts">
import { computed } from 'vue'
import type { OemLocation } from '@/types'
import GaugeReadings from './GaugeReadings.vue'
import CameraVideoPlayer from './CameraVideoPlayer.vue'
import { useLocationDetail } from '@/composables/useLocationDetail'

const props = defineProps<{
  location: OemLocation
}>()

const readingState = useLocationDetail(
  () => props.location.id,
  () => props.location.deviceType,
  500,
)

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
    <div class="location-detail__body">
      <template v-if="location.deviceType === 'Aware' || location.deviceType === 'Usgs'">
        <h4>{{ location.name }}</h4>

        <!-- Gauge detail -->
        <GaugeReadings :reading-state="readingState" :location="location" />

        <h6>Gauge Information</h6>
        <table>
          <thead>
            <tr>
              <th>Last Updated</th>
              <th>Coordinates</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ lastUpdatedDate }}</td>
              <td>{{ location.latitude }}, {{ location.longitude }}</td>
            </tr>
          </tbody>
        </table>
      </template>

      <!-- this will be part of new Location Detail query on backend -->
      <!-- Camera detail -->
      <template v-else-if="location.deviceType === 'Camera'">
        <h2>{{ location.name }}</h2>

        <p>
          This video camera is located at the intersection of
          {{ location.name }} and allows you to monitor road conditions and potential flooding in
          real time.
        </p>

        <CameraVideoPlayer
          v-if="location.locationCardInfo.src"
          :video-url="location.locationCardInfo.src"
          :autoplay="true"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.location-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}

.location-detail__body {
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
