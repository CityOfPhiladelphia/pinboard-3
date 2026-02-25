<script setup lang="ts">
import { ref } from 'vue';
import type { Location } from '../types'

defineProps<{
  locations: Location[]
}>()

// async function getData() {
//   const url = "https://flood-monitoring-test-api.phila.gov/api/aware/gauge/all";
//   try {
//     const response = await fetch(url);
//     if (!response.ok) {
//       throw new Error(`Response status: ${response.status}`);
//     }

//     const result = await response.json();
//     console.log(result);

//   } catch (error) {
//     if (error instanceof Error) {
//       console.error(error.message);
//     } else {
//       console.error(error);
//     }
//   }
// }

type Brett = { kind: 'Loading' } | { kind: 'Loaded', data: any }

const brett = ref<Brett>({ kind: 'Loading' });

const myHeaders = new Headers();
myHeaders.append("x-api-key", "gTQdOHPUJU7m3C4iz7hm849lJhoOwqAh1ICxygsD");

const jake = await fetch("https://flood-monitoring-test-api.phila.gov/api/aware/gauge/all", {
  method: "GET",
  headers: myHeaders,
  redirect: "follow"
})
  // .then((response) => response.text())
  // .then((result) => console.log(result))
  // .catch((error) => console.error(error));



</script>

<template>
  <div class="location-list">
    <p>Location List</p>
    <div>
      {{ brett }}
    </div>
    <div>
      {{  jake  }}
    </div>
  </div>
</template>

<style scoped>
.location-list {
  padding: 1rem;
}
</style>
