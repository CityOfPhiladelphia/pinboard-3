<!-- ABOUTME: List row for a knowledge article; whole row links to the detail page. -->
<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faChevronRight } from '@fortawesome/pro-solid-svg-icons'
import type { Article } from '@/composables/useKnowledgeArticles'

defineProps<{ article: Article }>()
</script>

<template>
  <article class="article-card">
    <RouterLink class="article-card__link" :to="`/answers/${article.id}`">
      <span class="article-card__title">{{ article.title }}</span>
      <FontAwesomeIcon
        :icon="faChevronRight"
        class="article-card__chevron"
        aria-hidden="true"
      />
    </RouterLink>
  </article>
</template>

<style scoped>
.article-card {
  border-bottom: 1px solid var(--ui-color-grey-300, #d6d6d6);
}
.article-card__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-m, 1rem);
  padding: var(--spacing-m, 1rem) var(--spacing-xs, 0.5rem);
  color: var(--ui-color-grey-700, #0f0f0f);
  text-decoration: none;
}
.article-card__title {
  font-weight: 600;
  line-height: 1.5;
}
.article-card__link:hover .article-card__title {
  text-decoration: underline;
}
.article-card__chevron {
  flex-shrink: 0;
  color: var(--ui-color-grey-500, #444);
}
</style>
