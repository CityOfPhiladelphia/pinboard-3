<script setup lang="ts">
import type { Location } from '../types'

defineProps<{
  locations: Location[]
}>()
</script>

<template>
  <div class="location-list">
    <p>Location List</p>
  </div>
</template>

<style scoped>
.location-list {
  padding: 1rem;
}
</style>
