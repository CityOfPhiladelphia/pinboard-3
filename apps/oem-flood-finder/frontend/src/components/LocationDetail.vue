<script setup lang="ts">
import type { Location } from '../types'
import { ref } from 'vue'
import GaugeReadings from './GaugeReadings.vue'
import CameraVideoPlayer from './CameraVideoPlayer.vue'
import { useLocationDetail } from '../composables/useLocationDetail'

const props = defineProps<{
  location: Location,
  onClose: (event: MouseEvent) => void
}>()

const readingState = useLocationDetail(
  () => props.location.id,
  () => props.location.other.kind,
  5
)

const closeBtn = ref<HTMLButtonElement>()

defineExpose({ focus: () => closeBtn.value?.focus() })
</script>

<template>
  <div class="location-detail content">

    <div class="location-detail__header">
      <button ref="closeBtn" class="close-btn" aria-label="Close panel" @click="onClose">✕</button>
    </div>

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

        <!-- <video id="camera-video" controls="" autoplay="" muted="" playsinline="" src="blob:https://oemstream.online/7d85b03c-8517-4351-a68a-069ee7affeed"></video> -->

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
