<!-- ABOUTME: A single selectable service type row in the issue-type step's directory/search
     results — a colored disc (matching the map pins and report cards) plus name/description. -->
<script setup lang="ts">
import { Icon } from '@phila/phila-ui-core'
import { IconCheck } from '@phila/phila-ui-core/icons'
import ServiceTypeIcon from '@/components/ServiceTypeIcon.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { computed } from 'vue'

const props = defineProps<{ serviceType: string; description: string }>()
const selected = defineModel<string>('selected')

const store = useReportSubmissionStore()

const currentlySelected = computed(() => store.category === props.serviceType)

function select() {
  selected.value = props.serviceType
}
</script>

<template>
  <details :open="false" :class="{ selected: currentlySelected }" @click="select">
    <summary @click.prevent>
      <ServiceTypeIcon :service-type="serviceType" :size="24" />
      {{ serviceType }}
      <Icon
        v-if="currentlySelected"
        :icon="IconCheck"
        decorative
        size="small"
        class="selected-check"
      />
    </summary>
    {{ description }}
  </details>
</template>

<style scoped>
details {
  padding: var(--spacing-m, 1rem);
  border-radius: var(--border-radius-s, 0.5rem);
  border: var(--border-width-s, 1px) solid var(--Schemes-Border-low, #ccc);
  background: var(--Schemes-Background, #fff);
}

summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.5rem);
  color: var(--Schemes-On-Surface-High, #000);

  /* Label/Default */
  font-family: var(--Label-Default-font-label-default-family, Montserrat);
  font-size: var(--Label-Default-font-label-default-size, 1rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Label-Default-font-label-default-lineheight, 1.5rem); /* 150% */
}

summary::marker {
  content: '';
}

.selected {
  border-radius: var(--border-radius-s, 0.5rem);
  border: var(--border-width-s, 1px) solid var(--sixers-blue-550-sixers-blue, #1f50f7);
}

.selected-check {
  margin-left: auto;
}
</style>
