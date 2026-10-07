<!-- ABOUTME: A single selectable service type row in the issue-type step's directory/search
     results — a colored disc (matching the map pins and report cards) plus name/description. -->
<script setup lang="ts">
import { Icon } from '@phila/phila-ui-core'
import { IconCheck } from '@phila/phila-ui-core/icons'
import ServiceTypeIcon from '@/components/ServiceTypeIcon.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { computed } from 'vue'
import type { Service } from '@/types/app'

const props = defineProps<{ serviceType: Service; description: string }>()
const selected = defineModel<Service | undefined>('selected', { default: undefined })

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
      <span v-if="currentlySelected" class="selected-check">
        <Icon :icon="IconCheck" decorative size="small" />
      </span>
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
  cursor: pointer;
}

details:hover {
  background: var(--Schemes-Surface-Container-Surface-Container-Low, #f3f3f3);
}

summary {
  cursor: pointer;
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
