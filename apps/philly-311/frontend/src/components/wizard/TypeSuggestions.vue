<!-- ABOUTME: "AI generated recommendations" panel for the Issue type step — the photo-classify
     suggestions filtered to catalog membership, sorted by confidence, top 3, click to select. -->
<script setup lang="ts">
import { computed } from 'vue'
import type { ServiceType } from '@/types/api'
import type { PhotoSuggestion } from '@/types/wizard'
import ServiceTypeIcon from '@/components/ServiceTypeIcon.vue'

const props = defineProps<{ suggestions: PhotoSuggestion[]; catalog: ServiceType[] }>()
const emit = defineEmits<{ select: [serviceType: string] }>()

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
    <h2 class="type-suggestions__title">AI generated recommendations</h2>
    <p class="type-suggestions__note">Based on objects in your photo</p>
    <ul class="type-suggestions__list">
      <li v-for="s in top" :key="s.serviceType">
        <button type="button" class="type-suggestions__card" @click="emit('select', s.serviceType)">
          <ServiceTypeIcon :service-type="s.serviceType" />
          <span class="type-suggestions__body">
            <span class="type-suggestions__name">{{ s.serviceType }}</span>
            <span class="type-suggestions__desc">{{ s.description }}</span>
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.type-suggestions {
  border: 1px solid var(--ui-color-grey-300, #d6d6d6);
  border-radius: 8px;
  padding: var(--spacing-m, 1rem);
  background: var(--ui-color-grey-100, #f5f5f5);
}
.type-suggestions__title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}
.type-suggestions__note {
  margin: 0 0 var(--spacing-s, 0.75rem);
  color: var(--ui-color-grey-700, #4a4a4a);
  font-size: 0.875rem;
}
.type-suggestions__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s, 0.75rem);
}
.type-suggestions__card {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  width: 100%;
  text-align: left;
  background: #fff;
  border: 1px solid var(--ui-color-primary, #0f4d90);
  border-radius: 8px;
  padding: var(--spacing-s, 0.75rem);
  cursor: pointer;
}
.type-suggestions__card:hover,
.type-suggestions__card:focus-visible {
  outline: 2px solid var(--ui-color-primary, #0f4d90);
  outline-offset: 1px;
}
.type-suggestions__body {
  display: flex;
  flex-direction: column;
}
.type-suggestions__name {
  font-weight: 700;
}
.type-suggestions__desc {
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
</style>
