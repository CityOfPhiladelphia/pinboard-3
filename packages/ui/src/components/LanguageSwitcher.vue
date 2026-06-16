<script setup lang="ts">
import type { Language } from '../i18n/languages'

defineProps<{
  languages: Language[]
  locale: string
}>()

const emit = defineEmits<{
  'update:locale': [code: string]
}>()

function onChange(event: Event) {
  emit('update:locale', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <label class="language-switcher">
    <span class="sr-only">Language</span>
    <select :value="locale" @change="onChange">
      <option v-for="lang in languages" :key="lang.code" :value="lang.code">
        {{ lang.title }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.language-switcher select {
  font-family: var(--Body-Default-font-body-default-family, inherit);
  padding: var(--spacing-xs, 0.25rem) var(--spacing-s, 0.5rem);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
