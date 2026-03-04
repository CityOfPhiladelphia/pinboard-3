<script setup lang="ts">
import { ref } from 'vue'
import { BaseCard, CardContent } from '@phila/phila-ui-cards'
import type { Location } from '../types'

defineProps<{
  locations: Location[]
}>()

const emit = defineEmits<{
  'card-click': [location: Location]
}>()

const pendingKeydown = ref(false)

function onCardKeyup(location: Location) {
  if (pendingKeydown.value) {
    emit('card-click', location)
    pendingKeydown.value = false
  }
}
</script>

<template>
  <div class="location-list">
    <BaseCard
      v-for="location in locations"
      :key="location.name"
      layout="vertical"
      class="location-card"
      tabindex="0"
      @click="emit('card-click', location)"
      @keydown.enter="pendingKeydown = true"
      @keyup.enter="onCardKeyup(location)"
    >
      <CardContent>{{ location.name }}</CardContent>
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
}
</style>
