<script setup lang="ts">
import { ref } from 'vue'
import { BaseCard, CardContent } from '@phila/phila-ui-cards'
import type { Location } from '../types'

const props = defineProps<{
  locations: Location[]
  hoveredId?: string | null
  selectedId?: string | null
  locationCardSlot?: (props: { location: Location; isHovered: boolean; isSelected: boolean }) => unknown
}>()

const emit = defineEmits<{
  select: [location: Location]
  hover: [id: string]
  'hover-end': []
}>()

const pendingKeydown = ref(false)

function onCardKeyup(location: Location) {
  if (pendingKeydown.value) {
    emit('select', location)
    pendingKeydown.value = false
  }
}
</script>

<template>
  <div class="location-list">
    <BaseCard
      v-for="location in locations"
      :key="location.id"
      layout="vertical"
      :class="['location-card', {
        'location-card--hovered': hoveredId === location.id,
        'location-card--selected': selectedId === location.id,
      }]"
      tabindex="0"
      @click="emit('select', location)"
      @mouseenter="emit('hover', location.id)"
      @mouseleave="emit('hover-end')"
      @keydown.enter="pendingKeydown = true"
      @keyup.enter="onCardKeyup(location)"
    >
      <CardContent>
        <component
          v-if="props.locationCardSlot"
          :is="() => props.locationCardSlot!({ location, isHovered: hoveredId === location.id, isSelected: selectedId === location.id })"
        />
        <template v-else>{{ location.id }}</template>
      </CardContent>
    </BaseCard>
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

