<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { BaseCard, CardContent } from '@phila/phila-ui-cards'
import type { AwareGauge, Location } from '../types'
import { B, d } from 'vue-router/dist/index-Cu9B0wDz.mjs';

defineProps<{
  locations: Location[]
}>()

const emit = defineEmits<{
  'card-click': [location: Location]
}>()

const pendingKeydown = ref(false)

function onCardKeyup(location: Location) {
  if (pendingKeydown.value) {
    emit('card-click', location)
    pendingKeydown.value = false
  }
}

type Brett = { kind: 'Loading' } | { kind: 'Loaded', data: AwareGauge[] } | { kind: 'Error', message: string }

const locations = ref<Brett>({ kind: 'Loading' });

onMounted(async () => {
  const myHeaders = new Headers();
  myHeaders.append("x-api-key", "gTQdOHPUJU7m3C4iz7hm849lJhoOwqAh1ICxygsD");

  const response = await fetch("https://flood-monitoring-test-api.phila.gov/aware/gauge/all", {
    method: "GET",
    headers: myHeaders,
    redirect: "follow"
  });

  if (!response.ok) {
    locations.value = { kind: 'Error', message: "Brett error" };
    return;
  }

  const data = await response.json();

  locations.value = { kind: 'Loaded', data: data };

});

</script>

<template>
  <div class="location-list">
    <!-- {{ JSON.stringify(locations) }} -->

    <div v-if="locations.kind === 'Error'">
      {{ locations.message }}      
    </div>

    <div v-if="locations.kind === 'Loading'">
      <progress></progress>
    </div>

    <div v-if="locations.kind === 'Loaded'">
      <BaseCard
        v-for="location in locations.data"
        :key="location.gaugeId"
        layout="vertical"
        class="location-card"
        tabindex="0"

      >
        <CardContent>{{ location.name }}</CardContent>
      </BaseCard>
    </div>

            <!-- @click="emit('card-click', location)"
        @keydown.enter="pendingKeydown = true"
        @keyup.enter="onCardKeyup(location)" -->

  </div>
</template>

<style scoped>
.location-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.location-card {
  cursor: pointer;
}
</style>
