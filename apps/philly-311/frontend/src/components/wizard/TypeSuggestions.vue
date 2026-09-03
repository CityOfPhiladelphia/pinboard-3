<!-- ABOUTME: "AI generated recommendations" panel for the Issue type step — the photo-classify
     suggestions filtered to catalog membership, sorted by confidence, top 3, click to select. -->
<script setup lang="ts">
import { computed } from 'vue'
import { Callout } from '@phila/phila-ui-callout'
import type { ServiceType } from '@/types/api'
import type { PhotoSuggestion } from '@/types/wizard'
import ServiceTypeCard from './ServiceTypeCard.vue'
import type { Service } from '@/types/app.ts'

const props = defineProps<{ suggestions: PhotoSuggestion[]; catalog: ServiceType[] }>()
const selected = defineModel<Service>('selected')

const calloutText = 'AI generated recommendations based on photo'

const top = computed(() => {
  const byName = new Map(props.catalog.map((s) => [s.serviceType, s]))
  return [...props.suggestions]
    .sort((a, b) => b.confidence - a.confidence)
    .map((s) => byName.get(s.serviceType))
    .filter((s): s is ServiceType => s !== undefined)
    .filter((s, i, arr) => arr.findIndex((x) => x.serviceType === s.serviceType) === i)
    .slice(0, 3)
})
</script>

<template>
  <section v-if="top.length" class="type-suggestions" aria-label="AI generated recommendations">
    <Callout :title="calloutText" />
    <ServiceTypeCard
      v-for="serviceType in top"
      :key="serviceType.serviceType"
      v-model:selected="selected"
      :service-type="serviceType.serviceType"
      :description="serviceType.description"
    />
  </section>
</template>

<style scoped>
.type-suggestions {
  display: grid;
  row-gap: var(--spacing-m, 1rem);
  margin-bottom: var(--spacing-m, 1rem);
}
</style>
