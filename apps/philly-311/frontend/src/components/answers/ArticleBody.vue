<!-- ABOUTME: Renders sanitized HTML for a knowledge-article body via v-html.
     Sanitization (allow-listed tags/attrs, noopener links) lives in utils/sanitize. -->
<script setup lang="ts">
import { computed } from 'vue'
import { sanitize } from '@/utils/sanitize'

const props = defineProps<{ html: string }>()
const safe = computed(() => sanitize(props.html))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- content is allow-list sanitized in utils/sanitize -->
  <div class="article-body" v-html="safe"></div>
</template>

<style scoped>
.article-body {
  line-height: 1.6;
}
.article-body :deep(h2),
.article-body :deep(h3),
.article-body :deep(h4) {
  margin: var(--spacing-m, 1rem) 0 var(--spacing-xs, 0.5rem);
}
.article-body :deep(p),
.article-body :deep(ul),
.article-body :deep(ol) {
  margin-bottom: var(--spacing-s, 0.75rem);
}
.article-body :deep(a) {
  color: var(--ui-color-primary, #0f4d90);
}
</style>
