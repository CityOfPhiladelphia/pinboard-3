<!-- ABOUTME: "All issue types" directory for the Issue type step — fuzzy search over name,
     description, and keywords; caseType-grouped two-column rows; click to select. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ServiceType } from '@/types/api'
import { fuzzyScore } from '@/utils/fuzzy'
import serviceTypeInfo from '@/data/service_types.json'
import CaseTypeCard from './CaseTypeCard.vue'
import ServiceTypeCard from './ServiceTypeCard.vue'

const props = defineProps<{ catalog: ServiceType[] }>()
const selected = defineModel<string>('selected')
const query = ref('')

const INFO = serviceTypeInfo as Record<string, { description: string; keywords: string[] }>

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
    <p class="type-directory__empty" role="status">
      {{ groups.length ? '' : 'No issue types match your search.' }}
    </p>

    <div v-for="caseType in groups" :key="caseType.caseType">
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
.type-directory__search-label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--spacing-xs, 0.25rem);
}
.type-directory__search {
  width: 100%;
  max-width: 480px;
  padding: var(--spacing-s, 0.5rem);
  border: 1px solid var(--Schemes-Border, #b3b3b3);
  border-radius: 4px;
  margin-bottom: var(--spacing-m, 1rem);
}
.type-directory__heading {
  font-size: 1.125rem;
  font-weight: 700;
  margin: var(--spacing-m, 1rem) 0 var(--spacing-xs, 0.25rem);
}
.type-directory__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: var(--spacing-l, 2rem);
}
.type-directory__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid var(--Schemes-Border-low, #d6d6d6);
  padding: var(--spacing-s, 0.75rem) 0;
  cursor: pointer;
}
.type-directory__row:hover .type-directory__name,
.type-directory__row:focus-visible .type-directory__name {
  text-decoration: underline;
}
.type-directory__body {
  display: flex;
  flex-direction: column;
}
.type-directory__name {
  font-weight: 700;
  color: var(--Schemes-Primary, #0f4d90);
}
.type-directory__desc {
  font-size: 0.875rem;
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
}
.type-directory__empty {
  color: var(--Schemes-On-Surface-Variant, #4a4a4a);
}
@media (max-width: 768px) {
  .type-directory__list {
    grid-template-columns: 1fr;
  }
}
</style>
