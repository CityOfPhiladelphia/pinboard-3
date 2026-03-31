<script setup lang="ts">
import type { LocationBasic } from '../types';

defineProps<{
  locations: unknown
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
