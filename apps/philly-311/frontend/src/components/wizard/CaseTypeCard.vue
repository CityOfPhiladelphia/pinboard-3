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
    />
  </details>
</template>

<style scoped>
summary::marker {
  content: '';
}
</style>
