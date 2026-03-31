<script setup lang="ts" generic="T">
import { ref } from 'vue'
import { BaseCard, CardContent } from '@phila/phila-ui-cards'

const props = defineProps<{
  locations: T[]
  hoveredId?: string | null
  selectedId?: string | null
  locationCardSlot?: (props: { location: T; isHovered: boolean; isSelected: boolean }) => unknown
  getId: (loc: T) => string
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
  <div class="location-list content">
    <BaseCard
      v-for="location in locations"
      :key="getId(location)"
      layout="vertical"
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
    >
      <CardContent>
        <component
          v-if="props.locationCardSlot"
          :is="() => props.locationCardSlot!({ location, isHovered: hoveredId === getId(location), isSelected: selectedId === getId(location) })"
        />
        <template v-else>{{ getId(location) }}</template>
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

