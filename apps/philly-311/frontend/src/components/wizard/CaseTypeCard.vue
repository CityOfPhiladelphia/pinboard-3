<!-- ABOUTME: A caseType group in the issue-type directory — several related service types
     (each its own ServiceTypeCard) collapsed under one heading. caseType is a broader
     grouping than any single service type, so it gets the same generic marker icon used
     as the fallback everywhere else (map pins, cards) rather than a type-specific one. -->
<script setup lang="ts">
import type { ServiceType } from '@/types/api'
import { ExpandChevron, Icon } from '@phila/phila-ui-core'
import { IconBars } from '@phila/phila-ui-core/icons'
import ServiceTypeCard from './ServiceTypeCard.vue'
import type { Service } from '@/types/app.ts'
import { computed, ref, watch } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission.ts'

const props = defineProps<{ caseType: string; serviceTypes: ServiceType[] }>()
const selected = defineModel<Service | undefined>('selected', { default: undefined })

const childrenOpen = ref(
  Object.fromEntries(props.serviceTypes.map((service) => [service.serviceType, false])),
)
const open = ref(true)
const stayOpen = ref(false)

const store = useReportSubmissionStore()

const childSelected = computed(() =>
  store.category &&
  props.serviceTypes.map((service) => service.serviceType).includes(store.category)
    ? store.category
    : false,
)

watch(selected, (nowSelected) => {
  if (nowSelected && !childSelected.value) stayOpen.value = false
})
watch(childSelected, () => (stayOpen.value = true))
watch(childrenOpen, () => (stayOpen.value = true), { deep: 1 })

function toggleOpen() {
  open.value = stayOpen.value || !open.value
  stayOpen.value = false
}
</script>

<template>
  <details class="case-type-card" :open="open" role="treeitem" @click.prevent="toggleOpen">
    <summary class="case-type-card-summary has-text-heading-5">
      <Icon :icon="IconBars" decorative size="small" />
      {{ caseType }}
      <ExpandChevron />
    </summary>
    <ServiceTypeCard
      v-for="serviceType in serviceTypes"
      :key="serviceType.caseType"
      v-model:selected="selected"
      v-model:open="childrenOpen[serviceType.serviceType]"
      :service-type="serviceType.serviceType"
      :description="serviceType.description"
      class="service-type-card"
    />
  </details>
</template>

<style scoped>
.case-type-card {
  border: none;
  background: var(--Schemes-Background, #fff);
}



.case-type-card[open]::details-content {
  padding-block-start: var(--spacing-xs, 0.5rem);
}

.case-type-card > .service-type-card {
  margin-inline-start: var(--spacing-s, 0.75rem);
  &:not(:last-child) {
    margin-block-end: var(--spacing-s, 0.75rem);
  }
}

.case-type-card:is(:open) > .case-type-card-summary {
  /* margin-bottom: calc(var(--spacing-s, 0.75rem) - var(--spacing-m, 1rem)); */
}

.case-type-card-summary {
  cursor: pointer;
  padding-block: var(--spacing-xs, 0.5rem);
  border-bottom: 1px solid var(--Schemes-Border, #8A8A8A);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.5rem);
  color: var(--Schemes-On-Surface-Low, #636363);
  font-family: var(--Label-Default-font-label-default-family, Montserrat);
  font-size: var(--Label-Default-font-label-default-size, 1rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Label-Default-font-label-default-lineheight, 1.5rem); /* 150% */
}

.case-type-card-summary:hover {
  background: var(--Schemes-Surface-Container-Surface-Container-Low, #f3f3f3);
}

.case-type-card-summary::marker {
  content: '';
}

.selected-check {
  margin-left: auto;
  display: flex;
  align-items: center;
  height: var(--Label-Default-font-label-default-lineheight, 1.5rem);
  color: var(--Palettes-Success-Success-300, #0c7216);
}
</style>
