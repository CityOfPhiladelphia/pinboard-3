<!-- ABOUTME: A single selectable service type row in the issue-type step's directory/search
     results — a colored disc (matching the map pins and report cards) plus name/description. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Icon } from '@phila/phila-ui-core'
import { IconCheck } from '@phila/phila-ui-core/icons'
import ServiceTypeIcon from '@/components/ServiceTypeIcon.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import type { Service } from '@/types/app'

const props = defineProps<{ serviceType: Service; description: string }>()
const selected = defineModel<Service | undefined>('selected', { default: undefined })
const open = defineModel<boolean>('open', { default: false })

const stayOpen = ref(false)

const store = useReportSubmissionStore()

const currentlySelected = computed(() => store.category === props.serviceType)

watch(currentlySelected, (nowSelected) => stayOpen.value = !nowSelected)

function select() {
  selected.value = props.serviceType
  open.value = stayOpen.value || !open.value
  stayOpen.value = false
}
</script>

<template>
  <details
    :open="open"
    :class="[{ selected: currentlySelected }, 'service-type-card']"
    role="treeitem"
    :aria-selected="currentlySelected"
    @click.prevent="select"
  >
    <summary class="service-type-card-summary has-text-label-default">
      <ServiceTypeIcon :service-type="serviceType" :size="24" />
      {{ serviceType }}
      <Icon
        v-if="currentlySelected"
        :icon="IconCheck"
        class="selected-check"
        decorative
        size="small"
      />
    </summary>
    <p v-text="description" />
  </details>
</template>

<style scoped>
.service-type-card {
  padding: var(--spacing-m, 1rem);
  border-radius: var(--border-radius-s, 0.5rem);
  border: var(--border-width-s, 1px) solid var(--Schemes-Border-low, #ccc);
  background: var(--Schemes-Background, #fff);
  cursor: pointer;
}

.service-type-card:not(:last-child) {
  margin-block-end: var(--spacing-m, 1rem)
}

.service-type-card:hover {
  background: var(--Schemes-Surface-Container-Surface-Container-Low, #f3f3f3);
}

.service-type-card[open]::details-content {
  padding-block-start: var(--spacing-s, 0.75rem);
}

.service-type-card-summary {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.5rem);
  color: var(--Schemes-On-Surface-High, #000);
}

.service-type-card-summary::marker {
  content: '';
}

.selected {
  border-radius: var(--border-radius-s, 0.5rem);
  border: var(--border-width-m, 0.125rem) solid var(--sixers-blue-550-sixers-blue, #1f50f7);
  padding: calc(
    var(--spacing-m, 1rem) - (var(--border-width-m, 0.125rem) - var(--border-width-s, 1px))
  );
}

.selected-check {
  margin-left: auto;
  display: flex;
  align-items: center;
  height: var(--Label-Default-font-label-default-lineheight, 1.5rem);
  color: var(--Palettes-Success-Success-300, #0c7216);
}
</style>
