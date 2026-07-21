<!-- ABOUTME: Service-type filter row for the finder panel. Adapts the finder's
     single-select string filter ('all' | serviceType) to phila-ui FilterChipGroup
     toggle chips; the All Filters button opens a FilterPanel for the same
     single-select model. -->
<script setup lang="ts">
import { computed, h, ref } from 'vue'
import type { FunctionalComponent, SVGAttributes } from 'vue'
import { FilterChipGroup } from '@phila/phila-ui-filter-chip'
import { FilterPanel } from '@phila/phila-ui-filter-panel'
import type { FilterDefinition, FilterValues } from '@phila/phila-ui-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { serviceTypeIconDefinition } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'

const PANEL_FILTER_KEY = 'serviceType'

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

const values = computed<Record<string, boolean>>(() =>
  Object.fromEntries(props.options.map((o) => [o.value, o.value === props.modelValue])),
)

/** Single-select on top of toggle chips: a newly toggled-on chip wins; none on → 'all'. */
function onUpdate(next: FilterValues) {
  const on = Object.keys(next).filter((k) => next[k] === true)
  const added = on.find((k) => k !== props.modelValue)
  const value = added ?? (on.length > 0 ? props.modelValue : 'all')
  if (value !== props.modelValue) emit('update:modelValue', value)
}

const showPanel = ref(false)

function openPanel() {
  showPanel.value = true
}

function closePanel() {
  showPanel.value = false
}

const panelFilters = computed<FilterDefinition[]>(() => [
  {
    key: PANEL_FILTER_KEY,
    label: 'Service Type',
    choices: props.options.map((o) => ({ text: o.label, value: o.value })),
  },
])

const panelValues = computed<FilterValues>(() => ({ [PANEL_FILTER_KEY]: values.value }))

/** Panel choices are a radio group: at most one selected. None selected → 'all'. */
function onPanelUpdate(next: FilterValues) {
  const choices = (next[PANEL_FILTER_KEY] as Record<string, boolean> | undefined) ?? {}
  const value = Object.keys(choices).find((k) => choices[k]) ?? 'all'
  if (value !== props.modelValue) emit('update:modelValue', value)
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
      @open-filters="openPanel"
    />
    <FilterPanel
      v-if="showPanel"
      :filters="panelFilters"
      :model-value="panelValues"
      :full-screen="true"
      @update:model-value="onPanelUpdate"
      @close="closePanel"
    />
  </div>
</template>

<style scoped>
.filter-chips {
  padding: 0 var(--spacing-m, 1rem) var(--spacing-s, 0.75rem);
}
</style>
