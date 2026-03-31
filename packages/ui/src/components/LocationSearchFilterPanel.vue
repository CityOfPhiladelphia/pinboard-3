<script setup lang="ts">
import { Search } from "@phila/phila-ui-search";
import type { LocationBasic } from '../types';

defineProps<{
  locations: unknown
}>()
</script>

<template>
  <div class="search-filter-pane">
    <Search class-name="location-search"
    placeholder="Search by address or keyword"
    />
  </div>
</template>

<style scoped>
.search-filter-pane {
  padding: 1rem;
}

.location-search {
  width: 100%
}
</style>
