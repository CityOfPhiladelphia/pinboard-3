<script setup lang="ts">
import type { ReadingState } from '@/composables/useLocationDetail'
import type { OemLocation } from '@/types'
import { LineChart, type ChartData, type LevelArea } from '@phila/phila-ui-charts'
import { computed, type ComputedRef, type Ref } from 'vue'

const props = defineProps<{
  readingState: ReadingState
  location: OemLocation
}>()

let chartData: Ref<ChartData[]> = computed(() => {
  if (props.readingState.kind === 'Loaded' && props.readingState.data) {
    return props.readingState.data.map((reading) => ({
      x: new Date(reading.validTimeUTC).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour12: true,
      }),
      y: reading.gaugeHeight === -9999.9 ? undefined : reading.gaugeHeight,
    }))
  }
  return []
})

// 2026-02-12T16:40:23z
</script>

<template>
  <progress v-if="readingState.kind === 'Loading'" />

  <div v-else-if="readingState.kind === 'Loaded'">
    <LineChart
      :data="chartData"
      :y-label="`Stage (${readingState.data[0]?.gaugeHeightUnit})`"
      :minimum-y-level="150"
    />

    <table v-if="location.deviceType === 'Aware'">
      <thead>
        <tr>
          <th>Created On</th>
          <th>Height</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="reading in readingState.data" :key="reading.readingId">
          <td>
            {{
              new Date(reading.validTimeUTC).toLocaleString('en-US', {
                timeZone: 'America/New_York',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })
            }}
          </td>

          <td>
            {{ reading.gaugeHeight === -9999.9 ? 'No data' : reading.gaugeHeight + ' in' }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Snapshot -->
    <template v-if="location.deviceType === 'Aware' && 0 in readingState.data">
      <h6>Current Snapshot</h6>
      <img :src="location.locationCardInfo.src" />
    </template>
  </div>

  <p v-else-if="readingState.kind === 'Error'">
    {{ readingState.message }}
  </p>
</template>

<style scoped>
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
