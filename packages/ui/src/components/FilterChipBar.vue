<script setup lang="ts">
import { FilterChipGroup } from '@phila/phila-ui-filter-chip'
import type { FilterDefinition, FilterValues } from '@phila/phila-ui-filter-chip'

const props = defineProps<{
  filters: FilterDefinition[]
  modelValue: FilterValues
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
      @update:model-value="onUpdate"
      @open-filters="emit('open-filters')"
    />
  </div>
</template>

<style scoped>
.filter-chip-bar {
  padding: 0.5rem 0;
}
</style>
