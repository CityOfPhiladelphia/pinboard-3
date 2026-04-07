<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@phila/phila-ui-search'
import { Tags } from '@phila/phila-ui-tags'
import type { LocationFilterOption } from '../types'
import { SortLocationsValues } from '../types'

const props = defineProps<{
  search?: string
  filterOptions?: LocationFilterOption[]
}>()

const emit = defineEmits<{
  searchString: [search: string]
  selectedFilter: [filter: string]
  sortOption: [sort: number]
}>()

const selectedFilter = ref(
  props.filterOptions ? props.filterOptions[0].value : undefined
)
const sortOption = ref<SortLocationsValues>(SortLocationsValues.None)
const searchString = ref<string>('')

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

function handleSearchChange(search: string) {
  searchString.value = search
}
</script>

<template>
  <Search
    v-if="search"
    class-name="location-search"
    :placeholder="search"
    @update:modelValue="handleSearchChange"
    @search="searchString ? emit('searchString', searchString) : null"
  />
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
.location-search {
  padding: 1rem 1rem 0rem 1rem;
  width: 100%;
}

.location-filters {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}

.location-sort {
  margin-left: auto;
}
</style>
