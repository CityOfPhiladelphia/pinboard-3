<script setup lang="ts">
import { ref } from 'vue'
import { Tags } from '@phila/phila-ui-tags'
import type { LocationFilterOption } from '../types'
import { SortLocationsValues } from '../types'

const props = defineProps<{
  filterOptions: LocationFilterOption[]
}>()

const emit = defineEmits<{
  selectedFilter: [filter: string]
  sortOption: [sort: number]
}>()

const selectedFilter = ref(props.filterOptions[0]?.value ?? null)
const sortOption = ref<SortLocationsValues>(SortLocationsValues.None)

function handleFilterChange(option: string) {
  if (selectedFilter.value === option) {
    return
  }
  selectedFilter.value = option
  emit('selectedFilter', selectedFilter.value)
}

function handleSortChange() {
  sortOption.value =
    ++sortOption.value in SortLocationsValues
      ? sortOption.value
      : SortLocationsValues.None
  emit('sortOption', sortOption.value)
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
    <Tags
      class="location-sort"
      :key="`filter-sort`"
      variant="action"
      size="large"
      color="grey"
      text="Sort"
      :selected="!!SortLocationsValues.None"
      @update:selected="handleSortChange()"
    />
  </div>
</template>

<style scoped>
.location-filters {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}

.location-sort {
  margin-left: auto;
}
</style>
