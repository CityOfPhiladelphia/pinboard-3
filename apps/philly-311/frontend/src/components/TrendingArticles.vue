<!-- ABOUTME: Horizontal "Trending articles" strip for the landing header; each card
     links to the in-app /answers/:id page. Hidden when there are no articles. -->
<script setup lang="ts">
import type { Article } from '@/composables/useKnowledgeArticles'

defineProps<{ articles: Article[] }>()
</script>

<template>
  <section v-if="articles.length" class="trending">
    <h2 class="trending__title">Trending articles</h2>
    <ul class="trending__list">
      <li v-for="article in articles" :key="article.id" class="trending__item">
        <RouterLink :to="`/answers/${article.id}`" class="trending__card">
          {{ article.title }}
        </RouterLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.trending {
  margin-top: var(--spacing-m, 1rem);
}
.trending__title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: var(--spacing-xs, 0.5rem);
}
.trending__list {
  display: flex;
  gap: var(--spacing-s, 0.75rem);
  overflow-x: auto;
  list-style: none;
  margin: 0;
  padding: 0;
}
.trending__item {
  flex: 0 0 auto;
}
.trending__card {
  display: block;
  width: 14rem;
  padding: var(--spacing-s, 0.75rem);
  border: 1px solid var(--ui-color-grey-300, #d6d6d6);
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
}
</style>
