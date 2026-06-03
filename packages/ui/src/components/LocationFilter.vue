<script setup lang="ts">
import { computed, ref } from 'vue'
import { TagGroup } from '@phila/phila-ui-tags'
import type { TagGroupChoice } from '@phila/phila-ui-tags'
import type { LocationFilterOption } from '../types'

const props = defineProps<{
  filterOptions: LocationFilterOption[]
}>()

const emit = defineEmits<{
  selectedFilter: [filter: string]
}>()

const choices = computed<TagGroupChoice[]>(() =>
  props.filterOptions.map((opt) => ({ text: opt.label, value: opt.value }))
)

const selected = ref<Array<string | number>>([props.filterOptions[0]?.value ?? ''])

function handleChange(values: Array<string | number>) {
  selected.value = values
  if (values[0] !== undefined) {
    emit('selectedFilter', String(values[0]))
  }
}
</script>

<template>
  <div class="location-filters">
    <TagGroup
      :choices="choices"
      :model-value="selected"
      variant="action"
      size="large"
      color="white"
      :multiple="false"
      @update:model-value="handleChange"
    />
  </div>
</template>

<style scoped>
.location-filters {
  padding: 0.75rem 1rem;
}
</style>
