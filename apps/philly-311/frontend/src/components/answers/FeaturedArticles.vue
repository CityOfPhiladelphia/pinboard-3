<!-- ABOUTME: Horizontal strip of the four newest featured knowledge articles
     (Salesforce featured list view). Hides itself when the fetch fails or is empty. -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { IconStar } from '@phila/phila-ui-core/icons'
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
        <IconStar class="featured__icon" aria-hidden="true" />
        <span class="featured__title">{{ article.title }}</span>
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
  background: #fff;
  border: 1px solid var(--Schemes-Border-low, #d6d6d6);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}
.featured__link {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  height: 100%;
  padding: var(--spacing-s, 0.75rem);
  color: var(--Schemes-On-Surface-High, #0f0f0f);
  text-decoration: none;
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
