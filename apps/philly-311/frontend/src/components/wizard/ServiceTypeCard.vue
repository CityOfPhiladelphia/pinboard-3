<!-- ABOUTME:  -->
<script setup lang="ts">
import { serviceTypeIcons } from '@/data/serviceTypeIconMap'
import { Icon } from '@phila/phila-ui-core'
import { IconCheck } from '@phila/phila-ui-core/icons'
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
    <summary>
      <Icon
        :icon="serviceTypeIcons?.[serviceType] ?? serviceTypeIcons.default"
        class="summary-icon"
      />
      {{ serviceType }}
      <Icon v-if="currentlySelected" :icon="IconCheck" class="summary-icon selected-check" />
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
  color: var(--Schemes-On-Surface-High, #000);

  /* Label/Default */
  font-family: var(--Label-Default-font-label-default-family, Montserrat);
  font-size: var(--Label-Default-font-label-default-size, 1rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Label-Default-font-label-default-lineheight, 1.5rem); /* 150% */
}

.summary-icon {
  color: var(--Schemes-Primary, #1034f4);
  text-align: right;

  /* Icons/Solid/Default */
  font-family: var(--Icon-Solid-Default-font-icon-solid-default-family, 'Font Awesome 7 Pro');
  font-size: var(--Icon-Solid-Default-font-icon-solid-default-size, 1.5rem);
  font-style: normal;
  font-weight: 900;
  line-height: normal;
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
