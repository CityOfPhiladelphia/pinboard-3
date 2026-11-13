<!-- ABOUTME: "All issue types" directory for the Issue type step — fuzzy search over name,
     description, and keywords; caseType-grouped two-column rows; click to select. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ServiceType } from '@/types/api'
import { fuzzyScore } from '@/utils/fuzzy'
import serviceTypeInfo from '@/data/service_types.json'
import CaseTypeCard from './CaseTypeCard.vue'
import ServiceTypeCard from './ServiceTypeCard.vue'
import type { Service } from '@/types/app.ts'

const noSearchMatch = 'No issue types match your search.'

const props = defineProps<{ catalog: ServiceType[] }>()
const selected = defineModel<Service | undefined>('selected', { default: undefined })
const query = ref('')

const INFO = serviceTypeInfo as Record<Service, { description: string; keywords: string[] }>

function matches(s: ServiceType): boolean {
  const q = query.value.trim()
  if (!q) return true
  if (fuzzyScore(q, s.serviceType, INFO[s.serviceType]?.keywords ?? []) > 0) return true
  return s.description.toLowerCase().includes(q.toLowerCase())
}

const groups = computed(() => {
  const byCase = new Map<string, ServiceType[]>()
  for (const s of props.catalog) {
    if (!matches(s)) continue
    const list = byCase.get(s.caseType) ?? []
    list.push(s)
    byCase.set(s.caseType, list)
  }
  return [...byCase.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([caseType, items]) => ({
      caseType,
      items: [...items].sort((a, b) => a.serviceType.localeCompare(b.serviceType)),
    }))
})
</script>

<template>
  <div class="type-directory" role="tree" :aria-required="true">
    <h5 class="type-directory__header has-text-heading-h5" v-text="'All issue types'" />
    <p v-if="!groups.length" class="type-directory__empty" role="status" v-text="noSearchMatch" />

    <div v-for="caseType in groups" :key="caseType.caseType" class="type-directory__cards">
      <CaseTypeCard
        v-if="caseType.items.length > 1"
        v-model:selected="selected"
        :case-type="caseType.caseType"
        :service-types="caseType.items"
        class="case-type-card"
      />
      <ServiceTypeCard
        v-else
        v-model:selected="selected"
        :service-type="caseType.items[0].serviceType"
        :description="caseType.items[0].description"
        class="service-type-card"
      />
    </div>
  </div>
</template>

<style scoped>
.type-directory {
  overflow: auto;
}

.type-directory__header {
  color: #374151;
  padding-block: var(--spacing-xs, 0.5rem);
}

.type-directory__cards:not(:last-child) > .case-type-card {
  margin-block-start: var(--spacing-xl, 2rem);
}

.type-directory__cards:not(:last-child) > .service-type-card {
  margin-block-start: var(--spacing-m, 1rem);
}
</style>
