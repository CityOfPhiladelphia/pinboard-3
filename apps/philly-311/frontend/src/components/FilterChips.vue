<!-- ABOUTME: Service-type filter row for the finder panel. Adapts the finder's
     single-select string filter ('all' | serviceType) to phila-ui FilterChipGroup
     toggle chips; the leading All Filters button resets to 'all'. -->
<script setup lang="ts">
import { computed, h } from 'vue'
import type { FunctionalComponent, SVGAttributes } from 'vue'
import { FilterChipGroup } from '@phila/phila-ui-filter-chip'
import type { FilterDefinition, FilterValues } from '@phila/phila-ui-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { serviceTypeIconDefinition } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'

const props = defineProps<{
  options: { value: string; label: string }[]
  modelValue: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

// FilterChipGroup icons are Vue functional components; wrap the FontAwesome
// service-type definitions so the chips match the map markers.
function chipIcon(label: string): FunctionalComponent<SVGAttributes> {
  const definition = serviceTypeIconDefinition(label)
  return (attrs) => h(FontAwesomeIcon, { ...attrs, icon: definition })
}

const filters = computed<FilterDefinition[]>(() =>
  props.options.map((o) => ({
    key: o.value,
    label: o.label,
    icon: chipIcon(o.label),
    iconColor: serviceTypeColor(o.label),
  })),
)

const values = computed<FilterValues>(() =>
  Object.fromEntries(props.options.map((o) => [o.value, o.value === props.modelValue])),
)

/** Single-select on top of toggle chips: a newly toggled-on chip wins; none on → 'all'. */
function onUpdate(next: FilterValues) {
  const on = Object.keys(next).filter((k) => next[k] === true)
  const added = on.find((k) => k !== props.modelValue)
  const value = added ?? (on.length > 0 ? props.modelValue : 'all')
  if (value !== props.modelValue) emit('update:modelValue', value)
}

function resetToAll() {
  if (props.modelValue !== 'all') emit('update:modelValue', 'all')
}
</script>

<template>
  <div class="filter-chips" role="group" aria-label="Filter reports by type">
    <FilterChipGroup
      :filters="filters"
      :model-value="values"
      :filter-button="true"
      filter-button-text="All Filters"
      @update:model-value="onUpdate"
      @open-filters="resetToAll"
    />
  </div>
</template>

<style scoped>
.filter-chips {
  padding: 0 var(--spacing-m, 1rem) var(--spacing-s, 0.75rem);
}
</style>
