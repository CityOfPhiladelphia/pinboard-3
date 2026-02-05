<script setup lang="ts">
import { VERSION } from '@pinboard/core'

defineProps<{
  msg: string
}>()
</script>

<template>
  <div class="hello-world">
    <h1>{{ msg }}</h1>
    <p>Using @pinboard/core v{{ VERSION }}</p>
  </div>
</template>
