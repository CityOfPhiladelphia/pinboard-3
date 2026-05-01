<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Tags } from '@phila/phila-ui-tags'
import { BottomSheet } from '@phila/phila-ui-bottom-sheet'

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

const formEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLElement | null>(null)
const anchorStyle = ref<Record<string, string>>({})

const isMobile = ref(false)
let mql: MediaQueryList | null = null

function handleMediaChange(e: MediaQueryListEvent) {
  isMobile.value = e.matches
}

onMounted(() => {
  mql = window.matchMedia('(max-width: 768px)')
  isMobile.value = mql.matches
  mql.addEventListener('change', handleMediaChange)
})

function recomputeAnchor() {
  const rect = triggerEl.value?.getBoundingClientRect()
  if (!rect) return
  anchorStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    zIndex: '1000',
  }
}

function handleDocumentClick(e: MouseEvent) {
  if (!panelOpen.value || isMobile.value) return
  const target = e.target as Node
  if (formEl.value?.contains(target) || triggerEl.value?.contains(target)) {
    return
  }
  closePanel()
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && panelOpen.value) {
    closePanel()
  }
}

watch(panelOpen, (isOpen) => {
  if (isOpen) {
    recomputeAnchor()
    document.addEventListener('mousedown', handleDocumentClick)
    document.addEventListener('keydown', handleKeydown)
    window.addEventListener('resize', recomputeAnchor)
    window.addEventListener('scroll', recomputeAnchor, true)
  } else {
    document.removeEventListener('mousedown', handleDocumentClick)
    document.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('resize', recomputeAnchor)
    window.removeEventListener('scroll', recomputeAnchor, true)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', recomputeAnchor)
  window.removeEventListener('scroll', recomputeAnchor, true)
  mql?.removeEventListener('change', handleMediaChange)
})
</script>

<template>
  <div class="sort-panel-root">
    <span ref="triggerEl">
      <Tags
        variant="action"
        size="large"
        color="grey"
        :text="triggerLabel"
        :selected="false"
        @update:selected="openPanel"
      />
    </span>
  </div>
  <Teleport to="body">
    <BottomSheet
      v-if="panelOpen && isMobile"
      :model-value="true"
      :snap-points="[100]"
      class="sort-panel-sheet"
      @update:model-value="(v: boolean) => { if (!v) closePanel() }"
    >
      <div ref="formEl" class="sort-panel-form sort-panel-form--mobile">
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
    </BottomSheet>
    <div
      v-else-if="panelOpen"
      ref="formEl"
      class="sort-panel-form"
      :style="anchorStyle"
    >
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
  </Teleport>
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

.sort-panel-form--mobile {
  width: 100%;
  box-shadow: none;
  border-radius: 0;
}

.sort-panel-sheet {
  z-index: 30;
}
</style>
