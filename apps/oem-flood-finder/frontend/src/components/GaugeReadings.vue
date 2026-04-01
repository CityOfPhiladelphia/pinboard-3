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
          <td>{{ reading.createdOn }}</td>
          <td>{{ reading.gaugeHeight }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="location.other.kind === 'Usgs'">
      <img :src="location.other.data.hydrographWithFloodCategoriesURL" :alt="location.other.data.hydrographURL">
    </div>

    <!-- Snapshot -->
    <template v-if="location.other.kind === 'Aware' && 0 in readingState.data">
      <h4>Current Snapshot</h4>
      <img :src="'https://images.flashflood.info:8282/' + location.other.data.modemNumber + '/' + readingState.data[0].pictureFilenameOnServer"/>
    </template>

  </div>

  <p v-else-if="readingState.kind === 'Error'">
    {{ readingState.message }}
  </p>

</template>
