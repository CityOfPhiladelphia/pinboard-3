<script setup lang="ts">
import { inject } from 'vue'
import { PINBOARD_CONFIG_KEY, PINBOARD_SLOTS_KEY } from '../types'

const config = inject(PINBOARD_CONFIG_KEY)!
const slots = inject(PINBOARD_SLOTS_KEY)!
</script>

<template>
  <div class="home-view content">
    <h1>{{ config.title }}</h1>
    <component v-if="slots.home" :is="() => slots.home!()" />
  </div>
</template>

<style scoped>
.home-view {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
  padding: 3rem 2rem;
}
</style>
