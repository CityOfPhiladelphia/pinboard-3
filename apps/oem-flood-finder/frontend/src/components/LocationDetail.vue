<script setup lang="ts">
import type { Gauge } from '../types'
import { useLocationDetail } from '../composables/useLocationDetail'

const props = defineProps<{
  gauge: Gauge,
  onClose: (event: MouseEvent) => void
}>()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const readingState = useLocationDetail(props.gauge.gaugeId, 5);

// const closeBtn = ref<HTMLButtonElement>(null)

// defineExpose({ focus: () => closeBtn.value?.focus() })

</script>

<template>
  <div class="location-detail content">

    <div class="location-detail__header">
      <button ref="closeBtn" class="close-btn" aria-label="Close panel" @click="onClose">✕</button>
    </div>

    <div class="location-detail__body">
      <h2>{{ gauge.name }}</h2>
      
      <progress v-if="readingState.kind==='Loading'"/>

      <p v-else-if="readingState.kind==='Loaded'">
        {{ readingState.data }}
      </p>

      <p v-else-if="readingState.kind==='Error'">
        {{ readingState.message }}
      </p>
      
    </div>

  </div>
</template>

<style scoped>
.location-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.location-detail__header {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem;
  flex-shrink: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}

.location-detail__body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
