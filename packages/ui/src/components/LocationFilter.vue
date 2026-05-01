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

const selectedFilter = ref(props.filterOptions[0].value)

function handleFilterChange(option: string) {
  if (selectedFilter.value === option) {
    return
  }
  selectedFilter.value = option
  emit('selectedFilter', selectedFilter.value)
}
</script>

<template>
  <div class="location-filters">
    <Tags
      v-for="opt in filterOptions"
      :key="`filter-${opt.value}`"
      variant="action"
      size="large"
      color="grey"
      :text="opt.label"
      :selected="selectedFilter === opt.value"
      @update:selected="handleFilterChange(opt.value)"
    />
  </div>
</template>

<style scoped>
.location-filters {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}

:deep(.phila-tag.phila-tag--grey:not(.is-selected)) {
  background: #ffffff;
}

:deep(
  .phila-tag.phila-tag--grey:not(.is-selected):not(.phila-tag--readonly):hover:not(
      :disabled
    )
) {
  background: #f5f5f5;
}
</style>
