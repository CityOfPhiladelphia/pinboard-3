<script setup lang="ts">
import { computed } from 'vue'
import type { Location } from '../types'
import type { ReadingState } from '../composables/useLocationDetail'

const props = defineProps<{
  location: Location,
  readingState: ReadingState
}>()

const gaugeData = computed(() => {
  if (props.location.other.kind !== 'Usgs') throw new Error('FloodStatus requires a Usgs location')
  return props.location.other.data
})
const units = computed(() => gaugeData.value.stageUnits)

const latestReading = computed(() => {
  if (props.readingState.kind !== 'Loaded') return null
  return props.readingState.data[0] ?? null
})

const currentHeight = computed(() => latestReading.value?.gaugeHeight ?? null)

const floodLevel = computed(() => {
  if (currentHeight.value === null) return null
  const h = currentHeight.value
  const g = gaugeData.value
  if (h >= g.majorStage) return 'Major flooding'
  if (h >= g.moderateStage) return 'Moderate flooding'
  if (h >= g.minorStage) return 'Minor flooding'
  if (h >= g.actionStage) return 'Action stage reached'
  return null
})

const distanceBelowAction = computed(() => {
  if (currentHeight.value === null || floodLevel.value !== null) return null
  return Math.round((gaugeData.value.actionStage - currentHeight.value) * 100) / 100
})

const activeImpacts = computed(() => {
  if (currentHeight.value === null || floodLevel.value === null) return []
  return gaugeData.value.floodImpacts
    .filter(i => currentHeight.value! >= i.stage)
    .sort((a, b) => a.stage - b.stage)
})

const stages = computed(() => [
  { name: 'Action', height: gaugeData.value.actionStage },
  { name: 'Minor', height: gaugeData.value.minorStage },
  { name: 'Moderate', height: gaugeData.value.moderateStage },
  { name: 'Major', height: gaugeData.value.majorStage },
])
</script>

<template>
  <div class="flood-status">
    <progress v-if="readingState.kind === 'Loading'" />

    <p v-else-if="readingState.kind === 'Error'">
      Unable to determine flood status.
    </p>

    <template v-else-if="currentHeight !== null">
      <!-- Current status line -->
      <p v-if="floodLevel" class="flood-status__level flood-status__level--active">
        Current: {{ currentHeight }} {{ units }} — {{ floodLevel }}
      </p>
      <p v-else class="flood-status__level">
        Current: {{ currentHeight }} {{ units }} — {{ distanceBelowAction }} {{ units }} below action stage
      </p>

      <!-- Stage thresholds table -->
      <h4>Flood Stage Thresholds</h4>
      <table>
        <tr><th>Stage</th><th>Height</th></tr>
        <tr v-for="stage in stages" :key="stage.name">
          <td>{{ stage.name }}</td>
          <td>{{ stage.height }} {{ units }}</td>
        </tr>
      </table>

      <!-- Flood impact statements -->
      <template v-if="activeImpacts.length > 0">
        <h4>Flood Impacts</h4>
        <ul>
          <li v-for="impact in activeImpacts" :key="impact.stage">
            <strong>{{ impact.stage }} {{ units }}:</strong> {{ impact.statement }}
          </li>
        </ul>
      </template>
      <!-- NOAA hydrograph -->
      <h4>NOAA Hydrograph</h4>
      <img
        :src="gaugeData.hydrographWithFloodCategoriesURL"
        :alt="'Hydrograph for ' + location.name"
        style="max-width: 100%"
      />
    </template>
  </div>
</template>
