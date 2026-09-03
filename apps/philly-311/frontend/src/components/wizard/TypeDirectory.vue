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

const props = defineProps<{ catalog: ServiceType[] }>()
const selected = defineModel<Service>('selected')
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
  <div class="type-directory">
    <h5 class="type-directory__header" v-text="'All issue types'" />
    <p v-if="!groups.length" class="type-directory__empty" role="status">
      {{ 'No issue types match your search.' }}
    </p>

    <div v-for="caseType in groups" :key="caseType.caseType" class="type-directory__cards">
      <CaseTypeCard
        v-if="caseType.items.length > 1"
        v-model:selected="selected"
        :case-type="caseType.caseType"
        :service-types="caseType.items"
      />
      <ServiceTypeCard
        v-else
        v-model:selected="selected"
        :service-type="caseType.items[0].serviceType"
        :description="caseType.items[0].description"
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
  padding: var(--spacing-s, 0.75rem) 0;

  /* Heading/H5 */
  font-family: var(--Heading-H5-font-heading-5-family, Montserrat);
  font-size: var(--Heading-H5-font-heading-5-size, 1.25rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Heading-H5-font-heading-5-lineheight, 1.75rem); /* 140% */
}

.type-directory__cards:not(:last-child) {
  margin-bottom: var(--spacing-s, 0.75rem);
}
</style>
