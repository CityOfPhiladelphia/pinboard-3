<script setup lang="ts">
import type { LocationDTO } from '../../../../apps/oem-flood-finder/frontend/src/types'

defineProps<{
  locations: LocationDTO
}>()
</script>

<template>
  <div class="search-filter-pane">
    <p>Search &amp; Filter Controls</p>
  </div>
</template>

<style scoped>
.search-filter-pane {
  padding: 1rem;
}
</style>
