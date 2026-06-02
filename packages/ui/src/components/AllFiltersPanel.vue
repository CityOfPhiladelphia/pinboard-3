<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search } from '@phila/phila-ui-search'
import { PhilaButton } from '@phila/phila-ui-button'
import { CheckboxGroup } from '@phila/phila-ui-checkbox'
import { RadioGroup } from '@phila/phila-ui-radio'
import { faChevronDown, faXmark } from '@fortawesome/pro-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import type { FilterDefinition, FilterValues } from '@phila/phila-ui-filter-chip'

const props = defineProps<{
  open: boolean
  filters: FilterDefinition[]
  modelValue: FilterValues
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:modelValue': [value: FilterValues]
}>()

// Draft state: edits stay local until Apply.
const draft = ref<FilterValues>({})
const search = ref('')
const collapsed = ref<Record<string, boolean>>({})

// Re-seed the draft each time the panel opens.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      draft.value = structuredClone(props.modelValue)
      search.value = ''
      collapsed.value = {}
    }
  },
  { immediate: true }
)

// Sections are checkbox/radio filters only (skip toggle-only filters with no choices).
const sections = computed(() =>
  props.filters.filter((f) => Array.isArray(f.choices) && f.choices.length > 0)
)

const visibleSections = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return sections.value
  return sections.value.filter(
    (f) =>
      f.label.toLowerCase().includes(q) ||
      (f.choices ?? []).some((c) => c.text.toLowerCase().includes(q))
  )
})

const activeCount = computed(() =>
  sections.value.reduce((n, f) => {
    if (f.excludeFromCount) return n
    const v = draft.value[f.key]
    return n + (Array.isArray(v) ? v.length : v ? 1 : 0)
  }, 0)
)

function checkboxModel(key: string): string[] {
  const v = draft.value[key]
  return Array.isArray(v) ? (v as string[]) : []
}
function setCheckbox(key: string, value: Array<string | number | boolean>) {
  draft.value = { ...draft.value, [key]: value as string[] }
}
function radioModel(key: string): string {
  const v = draft.value[key]
  return typeof v === 'string' ? v : ''
}
function setRadio(key: string, value: string) {
  draft.value = { ...draft.value, [key]: value }
}

function toggleSection(key: string) {
  collapsed.value = { ...collapsed.value, [key]: !collapsed.value[key] }
}
function close() {
  emit('update:open', false)
}
function reset() {
  draft.value = {}
}
function apply() {
  emit('update:modelValue', structuredClone(draft.value))
  close()
}
</script>

<template>
  <div v-if="props.open" class="all-filters-panel">
    <header class="all-filters-header">
      <h2>All Filters</h2>
      <button class="icon-button" aria-label="Close filters" @click="close">
        <FontAwesomeIcon :icon="faXmark" />
      </button>
    </header>

    <Search v-model="search" placeholder="Search" />

    <div class="all-filters-sections">
      <section v-for="f in visibleSections" :key="f.key" class="filter-section">
        <button class="section-toggle" @click="toggleSection(f.key)">
          <span>{{ f.label }}</span>
          <FontAwesomeIcon
            :icon="faChevronDown"
            :class="{ collapsed: collapsed[f.key] }"
          />
        </button>
        <div v-show="!collapsed[f.key]" class="section-body">
          <CheckboxGroup
            v-if="f.multiple"
            :group-label="f.label"
            :choices="f.choices ?? []"
            :model-value="checkboxModel(f.key)"
            @update:model-value="(v) => setCheckbox(f.key, v)"
          />
          <RadioGroup
            v-else
            :group-label="f.label"
            :choices="f.choices ?? []"
            :model-value="radioModel(f.key)"
            @update:model-value="(v) => setRadio(f.key, v)"
          />
        </div>
      </section>
    </div>

    <footer class="all-filters-footer">
      <PhilaButton variant="secondary" @click="reset">Reset</PhilaButton>
      <PhilaButton variant="primary" @click="apply">
        Apply{{ activeCount ? ` (${activeCount})` : '' }}
      </PhilaButton>
    </footer>
  </div>
</template>

<style scoped>
.all-filters-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  height: 100%;
  background: #fff;
  overflow-y: auto;
}
.all-filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
}
.all-filters-sections {
  display: flex;
  flex-direction: column;
}
.filter-section {
  border-bottom: 1px solid #ccc;
  padding: 0.75rem 0;
}
.section-toggle {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  cursor: pointer;
  font-size: inherit;
  font-weight: 700;
  font-family: var(--Body-Default-font-body-default-family);
}
.section-toggle .collapsed {
  transform: rotate(-90deg);
}
.section-body {
  padding-top: 0.75rem;
}
.all-filters-footer {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
}
.all-filters-footer > * {
  flex: 1;
}
</style>
