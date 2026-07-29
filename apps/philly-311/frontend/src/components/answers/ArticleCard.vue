<!-- ABOUTME: List row for a knowledge article; whole row links to the detail page. -->
<script setup lang="ts">
import { Icon } from '@phila/phila-ui-core'
import { IconChevronRight } from '@phila/phila-ui-core/icons'
import type { Article } from '@/composables/useKnowledgeArticles'

defineProps<{ article: Article }>()
</script>

<template>
  <article class="article-card">
    <RouterLink class="article-card__link" :to="`/answers/${article.id}`">
      <span class="article-card__title">{{ article.title }}</span>
      <Icon :icon="IconChevronRight" decorative class="article-card__chevron" />
    </RouterLink>
  </article>
</template>

<style scoped>
.article-card {
  border-bottom: 1px solid var(--Schemes-Border-low, #d6d6d6);
}
.article-card__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-m, 1rem);
  padding: var(--spacing-m, 1rem) var(--spacing-xs, 0.5rem);
  color: var(--Schemes-On-Surface-High, #0f0f0f);
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
  color: var(--Schemes-On-Surface-Variant, #444);
}
</style>
