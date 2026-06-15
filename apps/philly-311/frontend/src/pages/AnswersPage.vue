<!-- ABOUTME: Knowledge-articles browse + search. Empty query pages through the full
     list; a non-empty query hits the server's full-text search (results replace the
     browse list and are never paginated). -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useKnowledgeArticles, type Article } from '@/composables/useKnowledgeArticles'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import ArticleCard from '@/components/answers/ArticleCard.vue'

const k = useKnowledgeArticles()

const items = ref<Article[]>([])
const nextPageToken = ref<string | undefined>(undefined)
const browseLoading = ref(false)
const browseError = ref<string | null>(null)

async function loadInitial() {
  browseLoading.value = true
  browseError.value = null
  try {
    const result = await k.loadArticles()
    items.value = result.items
    nextPageToken.value = result.nextPageToken
  } catch (err) {
    browseError.value = (err as Error).message ?? 'Could not load articles.'
  } finally {
    browseLoading.value = false
  }
}

async function loadMore() {
  if (!nextPageToken.value) return
  browseLoading.value = true
  browseError.value = null
  try {
    const result = await k.loadArticles({ nextPageToken: nextPageToken.value })
    items.value = [...items.value, ...result.items]
    nextPageToken.value = result.nextPageToken
  } catch (err) {
    browseError.value = (err as Error).message ?? 'Could not load articles.'
  } finally {
    browseLoading.value = false
  }
}

// Search results replace the browse list while a query is set; null = browse mode.
const {
  query,
  results: searchResults,
  loading: searchLoading,
  error: searchError,
} = useDebouncedSearch<Article[] | null>({
  initial: null,
  fetcher: async (q) => (await k.loadArticles({ search: q })).items,
  onEmpty: () => {
    void loadInitial()
    return null
  },
})

const isSearching = computed(() => query.value.trim().length > 0)
const visible = computed(() => searchResults.value ?? items.value)
const isLoading = computed(() => searchLoading.value || browseLoading.value)
const errorMessage = computed(() => searchError.value ?? browseError.value)

onMounted(loadInitial)
</script>

<template>
  <main class="answers">
    <nav class="answers__crumb" aria-label="Breadcrumb">
      <RouterLink to="/">Home</RouterLink> / <span>Answers</span>
    </nav>

    <h1>Answers</h1>
    <p class="answers__intro">
      Browse common questions and how to file specific kinds of requests.
    </p>

    <label class="sr-only" for="answers-search">Search articles</label>
    <input
      id="answers-search"
      v-model="query"
      type="search"
      class="answers__search"
      placeholder="Search…"
    />

    <p v-if="isLoading" class="answers__status">Loading articles&hellip;</p>
    <p v-else-if="errorMessage" role="alert" class="answers__status">{{ errorMessage }}</p>
    <p v-else-if="visible.length === 0 && isSearching" class="answers__status">
      No articles match &ldquo;{{ query.trim() }}&rdquo;.
    </p>
    <p v-else-if="visible.length === 0" class="answers__status">No articles available.</p>

    <ul v-else class="answers__list">
      <li v-for="article in visible" :key="article.id">
        <ArticleCard :article="article" />
      </li>
    </ul>

    <button
      v-if="nextPageToken && !isSearching"
      type="button"
      class="answers__more"
      data-test="answers-more"
      :disabled="isLoading"
      @click="loadMore"
    >
      Load more
    </button>
  </main>
</template>

<style scoped>
.answers {
  max-width: 980px;
  margin: 0 auto;
  padding: var(--spacing-m, 1rem);
  height: 100%;
  overflow-y: auto;
}
.answers__crumb {
  font-size: 0.875rem;
  margin-bottom: var(--spacing-s, 0.75rem);
}
.answers__intro {
  margin-bottom: var(--spacing-m, 1rem);
}
.answers__search {
  width: 100%;
  max-width: 480px;
  padding: var(--spacing-s, 0.75rem);
  border: 1px solid var(--ui-color-grey-300, #d6d6d6);
  border-radius: 8px;
  margin-bottom: var(--spacing-l, 1.5rem);
}
.answers__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--spacing-s, 0.75rem);
}
.answers__status {
  margin: var(--spacing-m, 1rem) 0;
}
.answers__more {
  margin: var(--spacing-l, 1.5rem) 0;
  padding: var(--spacing-s, 0.5rem) var(--spacing-l, 1.5rem);
  border-radius: 9999px;
  font-weight: 600;
  cursor: pointer;
  background: #fff;
  color: var(--ui-color-primary, #0f4d90);
  border: 1px solid var(--ui-color-primary, #0f4d90);
}
.answers__more:disabled {
  opacity: 0.5;
  cursor: default;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
