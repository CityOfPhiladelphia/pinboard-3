<script setup lang="ts">
import type { Reading } from '@/types';
import { onMounted, ref } from 'vue';

const props = defineProps<{
  gaugeId: string,
  limit: number
}>()

type ResponseStatus = { kind: 'Loading' } | { kind: 'Loaded', data: Reading[] } | { kind: 'Error', message: string }

const readings = ref<ResponseStatus>({ kind: 'Loading' })

onMounted(async () => {

  console.log(props.gaugeId)
  const myHeaders = new Headers();
  myHeaders.append("x-api-key", "");

  const response = await fetch( `https://flood-monitoring-test-api.phila.gov/aware/reading/${props.gaugeId}?limit=${props.limit}`, {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  });

  if (!response.ok) {
    readings.value = { kind: 'Error', message: "Readings API resposne error" };
    return;
  }

  const data = await response.json();

  readings.value = { kind: 'Loaded', data: data };

});

</script>

<template>
  <button>{{ gaugeId }}</button>

  {{ readings }}

  <div v-if="readings.kind === 'Loaded'">
    <p
      v-for="reading in readings.data"
      :key="reading.readingId"
      layout="vertical"
      class="location-card"
      tabindex="0"
    >
      {{ reading.gaugeHeight }}
    </p>
  </div>

</template>