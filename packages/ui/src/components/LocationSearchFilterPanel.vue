<script setup lang="ts">
import { ref } from 'vue'
import type { LocationFilterOption } from '../types';

const props = defineProps<{
  filterOptions: LocationFilterOption[]
}>()

const emit = defineEmits<{
  selectedOption: [location: Location]
}>()

const selectedFilter = ref(props.filterOptions[0].value);

</script>

<template>
  <div class="location-filters">
    <button v-for="opt in filterOptions" :key="opt.value"
      :class="['filter-pill', { active: selectedFilter === opt.value }]" @click="selectedFilter = opt.value">
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.location-filters {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  flex-shrink: 0;
}

.filter-pill {
  padding: 0.375rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 1rem;
  background: #fff;
  cursor: pointer;
  font-size: 0.8125rem;
}

.filter-pill.active {
  background: var(--Schemes-Primary, #2176d2);
  border-color: var(--Schemes-Primary, #2176d2);
  color: #fff;
}
</style>
