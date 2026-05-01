<script setup lang="ts">
import { ref, computed } from 'vue'
import { Tags } from '@phila/phila-ui-tags'

export type SortPanelOption = {
  value: string
  label: string
}

const props = defineProps<{
  sortOptions: SortPanelOption[]
  appliedSort: string | null
  locationAvailable: boolean
}>()

const emit = defineEmits<{
  'update:appliedSort': [value: string | null]
}>()

const panelOpen = ref(false)
const pendingSelection = ref<string | null>(null)

const triggerLabel = computed(() => {
  if (!props.appliedSort) return 'Sort'
  const match = props.sortOptions.find((o) => o.value === props.appliedSort)
  return match ? `Sort: ${match.label}` : 'Sort'
})

function openPanel() {
  pendingSelection.value = props.appliedSort
  panelOpen.value = true
}

function closePanel() {
  panelOpen.value = false
}

function applySort() {
  emit('update:appliedSort', pendingSelection.value)
  closePanel()
}

function resetSort() {
  emit('update:appliedSort', null)
  closePanel()
}
</script>

<template>
  <div class="sort-panel-root">
    <Tags
      variant="action"
      size="large"
      color="grey"
      :text="triggerLabel"
      :selected="false"
      @update:selected="openPanel"
    />
    <div class="sort-panel-form">
      <h3 class="sort-panel-heading">Sort by</h3>
      <ul class="sort-panel-options">
        <li
          v-for="option in sortOptions"
          :key="option.value"
          class="sort-panel-option"
        >
          <label
            :class="{
              'sort-panel-label--disabled':
                option.value === 'DistAsc' && !locationAvailable,
            }"
          >
            <input
              type="radio"
              name="sort-panel-radio"
              :value="option.value"
              :checked="pendingSelection === option.value"
              :disabled="option.value === 'DistAsc' && !locationAvailable"
              @change="pendingSelection = option.value"
            />
            <span>{{ option.label }}</span>
          </label>
          <p
            v-if="option.value === 'DistAsc' && !locationAvailable"
            class="sort-panel-hint"
          >
            Share your location to sort by distance
          </p>
        </li>
      </ul>
      <div class="sort-panel-actions">
        <button type="button" class="sort-panel-reset" @click="resetSort">
          Reset
        </button>
        <button type="button" class="sort-panel-apply" @click="applySort">
          Apply
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sort-panel-root {
  position: relative;
}

.sort-panel-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--Schemes-Surface-Bright, white);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  width: 280px;
}

.sort-panel-heading {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.sort-panel-options {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sort-panel-option label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.sort-panel-label--disabled {
  cursor: not-allowed;
  color: var(--Schemes-On-Surface-Variant, #888);
}

.sort-panel-hint {
  margin: 0.25rem 0 0 1.5rem;
  font-size: 0.75rem;
  color: var(--Schemes-On-Surface-Variant, #888);
}

.sort-panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.sort-panel-reset {
  background: none;
  border: none;
  color: var(--Schemes-Primary, #1976d2);
  cursor: pointer;
  text-decoration: underline;
}

.sort-panel-apply {
  background: var(--Schemes-Primary, #1976d2);
  color: white;
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1.25rem;
  cursor: pointer;
  font-weight: 600;
}
</style>
