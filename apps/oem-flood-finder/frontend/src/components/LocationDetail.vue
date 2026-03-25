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
        <GaugeReadings :reading-state="readingState" />

        <template v-if="location.other.kind === 'Aware'">
          <h4>Current Snapshot</h4>
          <img :src="'https://images.flashflood.info:8282/' + location.other.data.modemNumber + '/' + location.other.data.pictureFilenameOnServer"/>
        </template>

        <h4>Gauge Information</h4>
          <table>
            <tr><th>Last Updated</th><th>Coordinates</th></tr>
            <tr>
              <td>{{ location.lastUpdated }}</td>
              <td>{{ location.latitude }}, {{ location.longitude }}</td>
            </tr>
          </table>

      </template>

      <!-- Camera detail -->
      <template v-else-if="location.other.kind === 'Camera'">
        <h2>{{ location.name }}</h2>
        
        <p v-if="location.other.data.locationDescription">
          {{ location.other.data.locationDescription }}
        </p>
        
        <a :href="location.other.data.pageUrl" target="_blank" rel="noopener noreferrer">
          View camera feed
        </a>

        <CameraVideoPlayer :video-url="location.other.data.pageUrl" />
        
      </template>
    </div>

  </div>
</template>

<style scoped>
.location-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: scroll;
}

.location-detail__header {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem;
  flex-shrink: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}

.location-detail__body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
