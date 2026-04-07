<script setup lang="ts">
import type { Location } from '@ui/types'
import GaugeReadings from './GaugeReadings.vue'
import CameraVideoPlayer from './CameraVideoPlayer.vue'
import { useLocationDetail } from '@/composables/useLocationDetail'

const props = defineProps<{
  location: Location
}>()

const readingState = useLocationDetail(
  () => props.location.id,
  () => props.location.other.kind,
  5,
)
</script>

<template>
  <div class="location-detail content">
    <div class="location-detail__body">
      <template v-if="location.other.kind === 'Aware' || location.other.kind === 'Usgs'">
        <h4>{{ location.name }}</h4>

        <h6>Gauge Reading</h6>

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
              <td>
                {{
                  location.lastUpdated
                    ? new Date(location.lastUpdated).toLocaleString('en-US', {
                        timeZone: 'America/New_York',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'N/A'
                }}
              </td>

              <td>{{ location.latitude }}, {{ location.longitude }}</td>
            </tr>
          </tbody>
        </table>
      </template>

      <!-- Camera detail -->
      <template v-else-if="location.other.kind === 'Camera'">
        <h2>{{ location.name }}</h2>

        <p v-if="location.other.data.locationDescription">
          {{ location.other.data.locationDescription }}
        </p>

        <CameraVideoPlayer :video-url="location.other.data.pageUrl" :autoplay="true" />
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
