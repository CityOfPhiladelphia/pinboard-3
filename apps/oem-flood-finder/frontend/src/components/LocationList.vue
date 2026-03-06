<script setup lang="ts">
import { ref } from 'vue'
import { BaseCard, CardContent } from '@phila/phila-ui-cards'
import type { Gauge } from '../types'

const props = defineProps<{
  gauges: Gauge[]
}>()

const emit = defineEmits<{
  'card-click': [gauge: Gauge]
}>()

const pendingKeydown = ref(false)

const gauges = ref(props.gauges);

function onCardKeyup(gauge: Gauge) {
  if (pendingKeydown.value) {
    emit('card-click', gauge)
    pendingKeydown.value = false
  }
}

</script>

<template>
  <div class="location-list">

    <BaseCard
      v-for="gauge in gauges"
      :key="gauge.gaugeId"
      layout="vertical"
      class="location-card"
      tabindex="0"
      @click="emit('card-click', gauge)"
      @keydown.enter="pendingKeydown = true"
      @keyup.enter="onCardKeyup(gauge)"
    >
      <CardContent>{{ gauge.name }}</CardContent>
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
