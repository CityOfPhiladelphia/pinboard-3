<!-- ABOUTME: Knowledge-article detail. Sanitized HTML body via ArticleBody; breadcrumb
     back to /answers; every article ends with a Start a report link into the wizard. -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useKnowledgeArticles, type Article } from '@/composables/useKnowledgeArticles'
import { ApiError } from '@/composables/useApiError'
import ArticleBody from '@/components/answers/ArticleBody.vue'
import PillButton from '@/components/PillButton.vue'

const route = useRoute()
const id = computed(() => route.params.id as string)

const { loadArticle } = useKnowledgeArticles()
const article = ref<Article | null>(null)
const isLoading = ref(false)
const error = ref<ApiError | null>(null)
const notFound = ref(false)

async function load() {
  const loadedId = id.value
  isLoading.value = true
  error.value = null
  notFound.value = false
  try {
    const result = await loadArticle(loadedId)
    if (id.value !== loadedId) return
    if (result === null) {
      notFound.value = true
      article.value = null
    } else {
      article.value = result
    }
  } catch (e) {
    if (id.value !== loadedId) return
    error.value = e instanceof ApiError ? e : new ApiError(0, (e as Error).message)
    article.value = null
  } finally {
    if (id.value === loadedId) isLoading.value = false
  }
}

onMounted(load)
watch(id, () => {
  void load()
})
</script>

<template>
  <main class="answer-detail">
    <nav class="answer-detail__crumb" aria-label="Breadcrumb">
      <RouterLink to="/">Home</RouterLink> /
      <RouterLink to="/answers">Answers</RouterLink> /
      <span>{{ article?.title ?? 'Article' }}</span>
    </nav>

    <p v-if="isLoading" class="answer-detail__status">Loading article&hellip;</p>

    <div v-else-if="notFound">
      <h1>Article not found</h1>
      <RouterLink to="/answers">Back to answers</RouterLink>
    </div>

    <p v-else-if="error" role="alert" class="answer-detail__status">
      Couldn't load this article. {{ error.message }}
    </p>

    <article v-else-if="article">
      <h1>{{ article.title }}</h1>
      <ArticleBody v-if="article.body" :html="article.body" />
      <p v-else class="answer-detail__status">
        This article doesn't have any content yet.
        <RouterLink to="/answers">Browse other answers</RouterLink>.
      </p>
      <PillButton variant="primary" to="/report" data-test="answer-cta">Start a report &rarr;</PillButton>
    </article>
  </main>
</template>

<style scoped>
.answer-detail {
  max-width: 980px;
  margin: 0 auto;
  padding: var(--spacing-m, 1rem);
  height: 100%;
  overflow-y: auto;
}
.answer-detail__crumb {
  font-size: 0.875rem;
  margin-bottom: var(--spacing-s, 0.75rem);
}
.answer-detail__status {
  margin: var(--spacing-m, 1rem) 0;
}
</style>
