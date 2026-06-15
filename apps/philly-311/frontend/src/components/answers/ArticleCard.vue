<!-- ABOUTME: List item card for a knowledge article; links to the detail page. -->
<script setup lang="ts">
import type { Article } from '@/composables/useKnowledgeArticles'

defineProps<{ article: Article }>()
</script>

<template>
  <article class="article-card">
    <RouterLink class="article-card__link" :to="`/answers/${article.id}`">
      {{ article.title }}
    </RouterLink>
  </article>
</template>

<style scoped>
.article-card {
  border: 1px solid var(--ui-color-grey-300, #d6d6d6);
  border-radius: 8px;
  background: #fff;
}
.article-card__link {
  display: block;
  padding: var(--spacing-m, 1rem);
  color: var(--ui-color-primary, #0f4d90);
  font-weight: 600;
  text-decoration: none;
}
.article-card__link:hover {
  text-decoration: underline;
}
</style>
