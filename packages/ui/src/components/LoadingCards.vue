<script setup lang="ts">
// vue imports
import { computed, useTemplateRef } from 'vue'
import { MapCard } from '@phila/phila-ui-cards'

withDefaults(
  defineProps<{
    cardScale?: number
  }>(),
  {
    cardScale: 120,
  }
)

const loadingCardsContainerRef = useTemplateRef('loadingCardsContainerRef')

const imageContainerDim = computed(() =>
  loadingCardsContainerRef.value ? loadingCardsContainerRef.value.clientHeight : 700
)
</script>

<template>
  <div ref="loadingCardsContainerRef" class="loading-cards-container">
    <MapCard v-for="n in Math.floor(imageContainerDim / cardScale)" :key="n" :is-loading="true" />
  </div>
</template>

<style scoped>
.loading-cards-container {
  display: grid;
  height: 100%;
  width: 100%;
  grid-template-rows: auto;
  row-gap: var(--spacing-m, 1rem);
}
</style>
