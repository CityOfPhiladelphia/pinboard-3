<script setup lang="ts">
import { FilterChipGroup } from '@phila/phila-ui-filter-chip'
import type { FilterDefinition, FilterValues } from '@phila/phila-ui-core'

const props = defineProps<{
  filters: FilterDefinition[]
  modelValue: FilterValues
  elevated?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterValues]
  'open-filters': []
}>()

function onUpdate(value: FilterValues) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="filter-chip-bar">
    <FilterChipGroup
      :filters="props.filters"
      :model-value="props.modelValue"
      color="white"
      filter-button
      :elevated="props.elevated"
      @update:model-value="onUpdate"
      @open-filters="emit('open-filters')"
    />
  </div>
</template>

<style scoped>
.filter-chip-bar {
  padding: 0.5rem 0;
}

/* Put the leading/trailing space inside the scroll track so it scrolls away with
   the chips: space before the first chip at scroll-start (and after the last at
   the end), but none once the row has been scrolled past it. */
.filter-chip-bar :deep(.phila-filter-chip-group__row) {
  padding-left: 1rem;
  padding-right: 1rem;
}
</style>
