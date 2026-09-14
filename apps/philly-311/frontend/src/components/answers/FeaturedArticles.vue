<!-- ABOUTME: Horizontal strip of the four newest featured knowledge articles
     (Salesforce featured list view). Hides itself when the fetch fails or is empty. -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Icon } from '@phila/phila-ui-core'
import { IconArrowTrendUp } from '@phila/phila-ui-core/icons'
import { BaseCard } from '@phila/phila-ui-cards'
import { useKnowledgeArticles, type Article } from '@/composables/useKnowledgeArticles'

const k = useKnowledgeArticles()
const articles = ref<Article[]>([])

onMounted(async () => {
  try {
    const result = await k.loadArticles({
      list: 'featured',
      sort: 'lastPublishedAt',
      direction: 'desc',
      limit: 4,
    })
    // The API ignores sort/direction/limit for list views and returns the
    // whole Salesforce list; enforce "newest 4" here until it honors them.
    articles.value = [...result.items]
      .sort((x, y) => (y.lastPublishedAt ?? '').localeCompare(x.lastPublishedAt ?? ''))
      .slice(0, 4)
  } catch {
    // A missing strip is preferable to an error banner over the hero.
    articles.value = []
  }
})
</script>

<template>
  <ul v-if="articles.length > 0" class="featured" aria-label="Featured articles">
    <li v-for="article in articles" :key="article.id" class="featured__card">
      <RouterLink class="featured__link" :to="`/answers/${article.id}`">
        <!-- BaseCard's own href only ever renders a plain <a> (no vue-router
             support), so navigation stays on the RouterLink above; the
             clickable/hover treatment is forced via class since that's tied
             to BaseCard's href/onClick presence, not a dedicated prop. -->
        <BaseCard layout="horizontal" class="phila-card featured__base-card phila-card--clickable">
          <Icon :icon="IconArrowTrendUp" decorative class="featured__icon" />
          <span class="featured__title">{{ article.title }}</span>
        </BaseCard>
      </RouterLink>
    </li>
  </ul>
</template>

<style scoped>
.featured {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: var(--spacing-m, 1rem);
  overflow-x: auto;
}
.featured__card {
  flex: 1 0 220px;
  max-width: 256px;
}
.featured__link {
  display: block;
  height: 100%;
  color: var(--Schemes-On-Surface-High, #0f0f0f);
  text-decoration: none;
}
/* Compound with .phila-card (BaseCard's own root class) so this outweighs
   BaseCard's own same-specificity `.phila-card { min-width: 300px }` rule
   regardless of CSS load order — these cards run narrower than that in this
   horizontal strip. */
.phila-card.featured__base-card {
  min-width: 0;
  height: 100%;
  --phila-card-inner-gap: var(--spacing-s, 0.75rem);
  --phila-card-inner-padding: var(--spacing-s, 0.75rem);
}
.featured__base-card :deep(.phila-card__inner) {
  align-items: center;
}
.featured__link:hover .featured__title {
  text-decoration: underline;
}
.featured__icon {
  flex-shrink: 0;
}
.featured__title {
  font-size: 0.875rem;
  line-height: 1.4;
}
</style>
