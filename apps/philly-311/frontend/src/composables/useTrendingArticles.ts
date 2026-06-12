// ABOUTME: Data layer for the Answers content section — loads the top-N knowledge articles
// ABOUTME: from the backend; failures resolve to an empty list.
import { ref, type Ref } from 'vue'
import { useKnowledgeArticles, type Article } from '@/composables/useKnowledgeArticles'

const TRENDING_COUNT = 5

export interface UseTrendingArticles {
  articles: Ref<Article[]>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
  init: () => Promise<void>
}

export function useTrendingArticles(): UseTrendingArticles {
  const { loadArticles } = useKnowledgeArticles()
  const articles = ref<Article[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function init() {
    isLoading.value = true
    error.value = null
    try {
      const { items } = await loadArticles({ pageSize: TRENDING_COUNT })
      articles.value = items
    } catch (e) {
      error.value = e as Error
      articles.value = []
    } finally {
      isLoading.value = false
    }
  }

  return { articles, isLoading, error, init }
}
