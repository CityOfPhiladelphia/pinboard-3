<!-- ABOUTME: Render-nothing component that constrains a MapLibre instance to Philadelphia
     by calling setMaxBounds and setMinZoom once the map prop is available. -->
<script setup lang="ts">
import { watch } from 'vue'
import { applyPhillyBounds, type MaplibreBounded } from '@/composables/useMapBounds'

const props = defineProps<{ map: unknown }>()

watch(
  () => props.map,
  (m) => {
    if (m) applyPhillyBounds(m as MaplibreBounded)
  },
  { immediate: true },
)
</script>

<template><slot /></template>
