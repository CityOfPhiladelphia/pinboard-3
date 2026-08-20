<!-- ABOUTME: -->
<script setup lang="ts">
import { serviceTypeIcons } from '@/data/serviceTypeIconMap'
import type { ServiceType } from '@/types/api'
import { Icon } from '@phila/phila-ui-core'
import ServiceTypeCard from './ServiceTypeCard.vue'

defineProps<{ caseType: string; serviceTypes: ServiceType[] }>()
const selected = defineModel<string>('selected')
</script>

<template>
  <details>
    <summary>
      <Icon :icon="serviceTypeIcons?.[caseType] ?? serviceTypeIcons.default" />
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

summary::marker {
  content: '';
}
</style>
