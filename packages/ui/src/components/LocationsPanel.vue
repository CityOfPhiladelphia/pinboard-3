<script setup lang="ts" generic="T">
import { ref } from 'vue'
import { MapCard } from '@phila/phila-ui-cards'
import type { MapCardProps } from '@phila/phila-ui-cards'
import LocationSearchFilterPanel from './LocationSearchFilterPanel.vue'

const props = defineProps<{
  locations: T[]
  hoveredId?: string | null
  selectedId?: string | null
  getId: (loc: T) => string
  getCardDetails: (loc: T) => MapCardProps
}>()

const emit = defineEmits<{
  select: [location: T]
  hover: [id: string]
  'hover-end': []
}>()

const pendingKeydown = ref(false)

function onCardKeyup(location: T) {
  if (pendingKeydown.value) {
    emit('select', location)
    pendingKeydown.value = false
  }
}
</script>

<template>
  <LocationSearchFilterPanel :locations="locations" />
  <div class="location-list content">
    <MapCard
      v-for="location in locations"
      :key="getId(location)"
      v-bind="getCardDetails(location)"
      :class="['location-card', {
        'location-card--hovered': hoveredId === getId(location),
        'location-card--selected': selectedId === getId(location),
      }]"
      tabindex="0"
      @click="emit('select', location)"
      @mouseenter="emit('hover', getId(location))"
      @mouseleave="emit('hover-end')"
      @keydown.enter="pendingKeydown = true"
      @keyup.enter="onCardKeyup(location)"
    />
  </div>
</template>

<style scoped>
.location-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.location-card {
  cursor: pointer;
  flex-shrink: 0;
}

.location-card--hovered {
  background-color: var(--Schemes-Surface-Container-Low, #f5f5f5);
  outline: 2px solid var(--Schemes-Primary, #1976d2);
}

.location-card--selected {
  background-color: var(--Schemes-Surface-Container, #eee);
  outline: 2px solid var(--Schemes-Primary, #1976d2);
}
</style>

