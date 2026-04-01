<script setup lang="ts">
import type { ReadingState } from '../composables/useLocationDetail'
import type { Location } from '../types'

const props = defineProps<{
  readingState: ReadingState,
  location: Location
}>()

</script>

<template>
  <progress v-if="readingState.kind === 'Loading'" />

  <div v-else-if="readingState.kind === 'Loaded'">

    <!-- Graph will go here -->
    <table v-if="location.other.kind === 'Aware'">
      <thead>
        <tr><th>Created On</th><th>Height</th></tr>
      </thead>
      <tbody>
        <tr v-for="reading in readingState.data" :key="reading.readingId">

          <td>{{ 
            new Date(reading.validTimeUTC).toLocaleString('en-US', { 
              timeZone: 'America/New_York',
              year: 'numeric', 
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }) }}
          </td>

          <td>{{ reading.gaugeHeight }} in</td>

        </tr>
      </tbody>
    </table>

    <div v-if="location.other.kind === 'Usgs'">
      <img :src="location.other.data.hydrographWithFloodCategoriesURL" :alt="location.other.data.hydrographURL">
    </div>

    <!-- Snapshot -->
    <template v-if="location.other.kind === 'Aware' && 0 in readingState.data">
      <h6>Current Snapshot</h6>
      <img :src="'https://images.flashflood.info:8282/' + location.other.data.modemNumber + '/' + readingState.data[0].pictureFilenameOnServer"/>
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

th, td {
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
