<script setup lang="ts">
import { useLocationDetail } from '../composables/useLocationDetail'

const props = defineProps<{ gaugeId: string, kind: 'Aware' | 'Usgs' }>()

const readingState = useLocationDetail(() => props.gaugeId, () => props.kind, 5)
</script>

<template>
  <progress v-if="readingState.kind === 'Loading'" />

  <table v-else-if="readingState.kind === 'Loaded'">
    <tr><th>Created On</th><th>Height</th></tr>
    <tr v-for="reading in readingState.data" :key="reading.readingId">
      <td>{{ reading.createdOn }}</td>
      <td>{{ reading.gaugeHeight }}</td>
    </tr>
  </table>

  <p v-else-if="readingState.kind === 'Error'">
    {{ readingState.message }}
  </p>
</template>
