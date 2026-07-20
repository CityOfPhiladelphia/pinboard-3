<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { BottomSheet } from '@phila/phila-ui-bottom-sheet'
import { Radio } from '@phila/phila-ui-radio'
import { PhilaButton, CloseButton } from '@phila/phila-ui-button'
import { IconSort } from '@phila/phila-ui-core/icons'
import type { SortLocationsOptions, SortMode, UserLocationState } from '../types'

const props = defineProps<{
  sortOptions: SortLocationsOptions
  appliedSort: SortMode
  userLocationState: UserLocationState
  isMobile: boolean
}>()

const emit = defineEmits<{
  'update:appliedSort': [value: SortMode]
}>()

const { t } = useI18n()

const panelOpen = ref(false)
const pendingSelection = ref<SortMode>('')

const triggerLabel = computed(() => {
  return props.appliedSort
    ? t('pinboard.sortBy', { label: props.sortOptions[props.appliedSort] })
    : t('pinboard.sort')
})

const locationAvailable = computed(() => {
  return ['located', 'watching'].includes(props.userLocationState)
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
  emit('update:appliedSort', '')
  closePanel()
}

const formEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLElement | null>(null)
const anchorStyle = ref<Record<string, string>>({})

function recomputeAnchor() {
  const rect = triggerEl.value?.getBoundingClientRect()
  if (!rect) return
  anchorStyle.value = {
    position: 'fixed',
    top: `${rect.bottom + 16}px`,
    right: `${window.innerWidth - rect.right}px`,
    zIndex: '1000',
  }
}

function handleDocumentClick(e: MouseEvent) {
  if (!panelOpen.value || props.isMobile) return
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
  if (isOpen && !props.isMobile) {
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
</script>

<template>
  <div class="sort-panel-root">
    <button ref="triggerEl" type="button" class="sort-panel-trigger" @click="openPanel">
      <IconSort class="sort-panel-trigger-icon" />
      <span>{{ triggerLabel }}</span>
    </button>
  </div>
  <Teleport v-if="panelOpen" to="body">
    <BottomSheet
      v-if="isMobile"
      :model-value="true"
      :snap-points="[35]"
      :show-handle="false"
      :style="{ zIndex: 101 }"
      class="sort-panel-sheet"
      @update:model-value="
        (v: boolean) => {
          if (!v) closePanel()
        }
      "
    >
      <div id="sort-options-mobile" />
    </BottomSheet>
    <Teleport to="#sort-options-mobile" :disabled="!isMobile">
      <div
        ref="formEl"
        :style="!isMobile ? anchorStyle : ''"
        class="sort-panel-form"
        :class="{ 'sort-panel-form-mobile': isMobile }"
      >
        <CloseButton v-if="isMobile" class="sort-panel-close" @click="closePanel" />
        <ul class="sort-panel-options">
          <li
            v-for="[value, label] in Object.entries(sortOptions)"
            :key="value"
            class="sort-panel-option"
          >
            <Radio
              name="sort-panel-radio"
              :value="value"
              :text="label"
              :model-value="pendingSelection"
              :disabled="value === 'DistAsc' && !locationAvailable"
              @update:model-value="pendingSelection = $event as SortMode"
            />
            <p v-if="value === 'DistAsc'" class="sort-panel-hint">
              {{ locationAvailable ? t('pinboard.sortClosest') : t('pinboard.sortShareLocation') }}
            </p>
          </li>
        </ul>
        <div class="sort-panel-actions">
          <PhilaButton variant="text" size="extra-small" @click="resetSort">{{
            t('pinboard.reset')
          }}</PhilaButton>
          <PhilaButton variant="primary" size="small" @click="applySort">{{
            t('pinboard.apply')
          }}</PhilaButton>
        </div>
      </div>
    </Teleport>
  </Teleport>
</template>

<style scoped>
.sort-panel-root {
  position: relative;
}

.sort-panel-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  height: var(--scale-400, 2rem);
  padding: var(--scale-75) var(--spacing-xs);
  background: #ffffff;
  border: 1px solid #c2c2c2;
  border-radius: var(--border-radius-xs);
  font-size: 0.875rem;
  color: #454545;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease;
}

.sort-panel-trigger:hover {
  background: #f5f5f5;
  color: #000;
}

.sort-panel-trigger-icon {
  font-size: 0.875rem;
}

.sort-panel-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1rem 0.5rem;
  background: var(--Schemes-Surface-Bright, white);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.18),
    0 2px 6px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  width: 280px;
  font-size: var(--Body-Default-font-body-default-size, 1rem);
  color: var(--Schemes-On-Surface, #333);
}

.sort-panel-options {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sort-panel-hint {
  margin: 0.25rem 0 0 calc(20px + var(--spacing-s, 0.75rem));
  font-size: 0.75rem;
  color: var(--Schemes-On-Surface-Variant, #888);
}

.sort-panel-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--Schemes-Outline-Variant, #e0e0e0);
}

.sort-panel-form-mobile {
  width: 100%;
  background: transparent;
  box-shadow: none;
  border-radius: 0;
}

.sort-panel-close {
  position: absolute;
  top: 8px;
  right: 12px;
}
</style>
