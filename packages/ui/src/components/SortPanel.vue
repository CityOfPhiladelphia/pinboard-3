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
  <Tags
    variant="action"
    size="large"
    color="grey"
    :text="triggerLabel"
    :selected="false"
    @update:selected="openPanel"
  />
</template>

<style scoped></style>
