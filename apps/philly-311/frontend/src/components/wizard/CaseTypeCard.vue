<!-- ABOUTME: A caseType group in the issue-type directory — several related service types
     (each its own ServiceTypeCard) collapsed under one heading. caseType is a broader
     grouping than any single service type, so it gets the same generic marker icon used
     as the fallback everywhere else (map pins, cards) rather than a type-specific one. -->
<script setup lang="ts">
import type { ServiceType } from '@/types/api'
import { Icon } from '@phila/phila-ui-core'
import { IconLocationDot } from '@phila/phila-ui-core/icons'
import ServiceTypeCard from './ServiceTypeCard.vue'

defineProps<{ caseType: string; serviceTypes: ServiceType[] }>()
const selected = defineModel<string>('selected')
</script>

<template>
  <details>
    <summary>
      <Icon :icon="IconLocationDot" decorative size="small" />
      {{ caseType }}
    </summary>
    <ServiceTypeCard
      v-for="serviceType in serviceTypes"
      :key="serviceType.caseType"
      v-model:selected="selected"
      :service-type="serviceType.serviceType"
      :description="serviceType.description"
      class="service-type-card"
    />
  </details>
</template>

<style scoped>
details {
  padding: var(--spacing-m, 1rem);
  border-radius: var(--border-radius-s, 0.5rem);
  border: var(--border-width-s, 1px) solid var(--Schemes-Border-low, #ccc);
  background: var(--Schemes-Background, #fff);
}

details > .service-type-card,
details:is(:open) > summary {
  margin-bottom: var(--spacing-s, 0.75rem);
}

summary {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs, 0.5rem);
  color: var(--Schemes-On-Surface-High, #000);
  font-family: var(--Label-Default-font-label-default-family, Montserrat);
  font-size: var(--Label-Default-font-label-default-size, 1rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Label-Default-font-label-default-lineheight, 1.5rem); /* 150% */
}

summary::marker {
  content: '';
}
</style>
