<script setup lang="ts">
import type { Location } from '../types'
import GaugeReadings from './GaugeReadings.vue'
import CameraVideoPlayer from './CameraVideoPlayer.vue'
import { useLocationDetail } from '../composables/useLocationDetail'

const props = defineProps<{
  location: Location
}>()

const readingState = useLocationDetail(
  () => props.location.id,
  () => props.location.other.kind,
  5
)

</script>

<template>
  <div class="location-detail content">

    <div class="location-detail__body">

      <template v-if="location.other.kind === 'Aware' || location.other.kind === 'Usgs'">
        <h2>{{ location.name }}</h2>
        <p >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
          labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
          laboris nisi ut aliquip ex ea commodo consequat.
        </p>

        <h4>Gauge Reading</h4>

        <!-- Gauge detail -->
        <GaugeReadings
          :reading-state="readingState"
          :location="location"
        />

        <h4>Gauge Information</h4>
          <table>
            <thead>
              <tr><th>Last Updated</th><th>Coordinates</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ location.lastUpdated }}</td>
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

        <CameraVideoPlayer
          :video-url="location.other.data.pageUrl"
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
</style>
