<!-- ABOUTME:  -->
<script setup lang="ts">
import { serviceTypeIcons } from '@/data/serviceTypeIconMap'
import { Icon } from '@phila/phila-ui-core'

const props = defineProps<{ serviceType: string; description: string }>()
const selected = defineModel<string>('selected')

function select() {
  selected.value = props.serviceType
}
</script>

<template>
  <details @click="select">
    <summary>
      <Icon :icon="serviceTypeIcons?.[serviceType] ?? serviceTypeIcons.default" />
      {{ serviceType }}
    </summary>
    {{ description }}
  </details>
</template>

<style scoped>
summary::marker {
  content: '';
}
</style>
