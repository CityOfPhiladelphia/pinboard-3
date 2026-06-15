<!-- ABOUTME: Knowledge-article detail. Sanitized HTML body via ArticleBody; breadcrumb
     back to /answers; every article ends with a Start a report link into the wizard. -->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useKnowledgeArticles, type Article } from '@/composables/useKnowledgeArticles'
import { ApiError } from '@/composables/useApiError'
import ArticleBody from '@/components/answers/ArticleBody.vue'

const route = useRoute()
const id = computed(() => route.params.id as string)

const { loadArticle } = useKnowledgeArticles()
const article = ref<Article | null>(null)
const isLoading = ref(false)
const error = ref<ApiError | null>(null)
const notFound = ref(false)

async function load() {
  isLoading.value = true
  error.value = null
  notFound.value = false
  try {
    const result = await loadArticle(id.value)
    if (result === null) {
      notFound.value = true
      article.value = null
    } else {
      article.value = result
    }
  } catch (e) {
    error.value = e instanceof ApiError ? e : new ApiError(0, (e as Error).message)
    article.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
watch(id, (next, prev) => {
  if (next !== prev) void load()
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
      <RouterLink class="answer-detail__cta" data-test="answer-cta" to="/report">
        Start a report &rarr;
      </RouterLink>
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
.answer-detail__cta {
  display: inline-block;
  margin: var(--spacing-l, 1.5rem) 0;
  padding: var(--spacing-s, 0.5rem) var(--spacing-l, 1.5rem);
  border-radius: 9999px;
  font-weight: 600;
  background: var(--ui-color-primary, #0f4d90);
  color: #fff;
  text-decoration: none;
}
</style>
