<script setup lang="ts">
import type { Location } from '../types'
import { ref } from 'vue'
import GaugeReadings from './GaugeReadings.vue'

const props = defineProps<{
  location: Location,
  onClose: (event: MouseEvent) => void
}>()

const closeBtn = ref<HTMLButtonElement>()

defineExpose({ focus: () => closeBtn.value?.focus() })
</script>

<template>
  <div class="location-detail content">

    <div class="location-detail__header">
      <button ref="closeBtn" class="close-btn" aria-label="Close panel" @click="onClose">✕</button>
    </div>

    <div class="location-detail__body">
      <h2>{{ location.name }}</h2>

      <!-- Gauge detail -->
      <GaugeReadings
        v-if="location.other.kind === 'AwareGauge' || location.other.kind === 'UsgsGauge'"
        :gauge-id="location.id"
      />

      <!-- Camera detail -->
      <template v-else-if="location.other.kind === 'Camera'">
        <p v-if="location.other.data.locationDescription">
          {{ location.other.data.locationDescription }}
        </p>
        <a :href="location.other.data.pageUrl" target="_blank" rel="noopener noreferrer">
          View camera feed
        </a>
      </template>
    </div>

  </div>
</template>

<style scoped>
.location-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
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
