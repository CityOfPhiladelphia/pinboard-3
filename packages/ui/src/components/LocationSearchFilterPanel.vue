<script setup lang="ts">
import { ref } from 'vue'
import { Tags } from '@phila/phila-ui-tags'
import type { LocationFilterOption } from '../types'

const props = defineProps<{
  filterOptions: LocationFilterOption[]
}>()

const emit = defineEmits<{
  selectedFilter: [filter: string]
}>()

const selectedFilter = ref(props.filterOptions[0]?.value ?? null)

function handleChange(option: string) {
  selectedFilter.value = option
  emit('selectedFilter', selectedFilter.value)
}
</script>

<template>
  <div class="location-filters">
    <Tags
      v-for="opt in filterOptions"
      :key="`${opt.value}-${selectedFilter}`"
      variant="action"
      size="large"
      color="grey"
      :text="opt.label"
      :selected="selectedFilter === opt.value"
      @update:selected="handleChange(opt.value)"
    />
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
