<script setup lang="ts">
import { ref, toRef } from 'vue'
import type { Location } from '../types'
import { useLocationDetail } from '../composables/useLocationDetail'

const props = defineProps<{
  location: Location | null
  onClose: (event: MouseEvent) => void
}>()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { locationDetail, isLoading, error } = useLocationDetail(toRef(props, 'location'))

const closeBtn = ref<HTMLButtonElement | null>(null)
defineExpose({ focus: () => closeBtn.value?.focus() })
</script>

<template>
  <div class="location-detail content">
    <div class="location-detail__header">
      <button ref="closeBtn" class="close-btn" aria-label="Close panel" @click="onClose">✕</button>
    </div>
    <div v-if="location" class="location-detail__body">
      <h2>{{ location.name }}</h2>
      <p>{{ location.address }}</p>
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
