<!-- ABOUTME: Knowledge-articles browse + search. Empty query pages through the full
     list; a non-empty query hits the server's full-text search (results replace the
     browse list and are never paginated). -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useKnowledgeArticles, type Article } from '@/composables/useKnowledgeArticles'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import ArticleCard from '@/components/answers/ArticleCard.vue'
import FeaturedArticles from '@/components/answers/FeaturedArticles.vue'
import { PhilaButton } from '@phila/phila-ui-button'
import heroPhoto from '@/assets/answers-hero.jpg'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faMagnifyingGlass, faArrowDownArrowUp } from '@fortawesome/pro-solid-svg-icons'

const k = useKnowledgeArticles()

const items = ref<Article[]>([])
const nextPageToken = ref<string | undefined>(undefined)
const browseLoading = ref(false)
const browseError = ref<string | null>(null)

// 'sort:direction' for the API, or '' for the server's default order.
const sortChoice = ref('')

function sortParams(): { sort?: 'title' | 'lastPublishedAt'; direction?: 'asc' | 'desc' } {
  if (!sortChoice.value) return {}
  const [sort, direction] = sortChoice.value.split(':')
  return { sort, direction } as ReturnType<typeof sortParams>
}

// With a token, appends the next page; without one, (re)loads the first page.
async function loadPage(token?: string) {
  browseLoading.value = true
  browseError.value = null
  try {
    const result = await k.loadArticles({
      ...sortParams(),
      ...(token ? { nextPageToken: token } : {}),
    })
    items.value = token ? [...items.value, ...result.items] : result.items
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
    void loadPage()
    return null
  },
})

const isSearching = computed(() => query.value.trim().length > 0)
const visible = computed(() => searchResults.value ?? items.value)
const isLoading = computed(() => searchLoading.value || browseLoading.value)
const errorMessage = computed(() => (isSearching.value ? searchError.value : browseError.value))

onMounted(loadPage)
</script>

<template>
  <main class="answers">
    <header class="answers__hero">
      <img class="answers__hero-photo" :src="heroPhoto" alt="" />
      <div class="answers__hero-text">
        <h1>Answers</h1>
        <p class="answers__intro">
          Browse common questions and how to file specific kinds of requests.
        </p>
      </div>
    </header>

    <FeaturedArticles class="answers__featured" />

    <div class="answers__content">
    <label class="sr-only" for="answers-search">Search articles</label>
    <div class="answers__search">
      <input
        id="answers-search"
        v-model="query"
        type="search"
        class="answers__search-input"
        placeholder="Search by topic or keyword"
      />
      <FontAwesomeIcon
        :icon="faMagnifyingGlass"
        class="answers__search-icon"
        aria-hidden="true"
      />
    </div>

    <div v-if="!isSearching" class="answers__chips">
      <label class="answers__chip">
        <FontAwesomeIcon
          :icon="faArrowDownArrowUp"
          class="answers__chip-icon"
          aria-hidden="true"
        />
        <select
          v-model="sortChoice"
          class="answers__chip-select"
          aria-label="Sort articles"
          data-test="answers-sort"
          @change="loadPage()"
        >
          <option value="">Sort</option>
          <option value="title:asc">Title A–Z</option>
          <option value="title:desc">Title Z–A</option>
          <option value="lastPublishedAt:desc">Newest first</option>
          <option value="lastPublishedAt:asc">Oldest first</option>
        </select>
      </label>
    </div>

    <p v-if="isLoading" class="answers__status">Loading articles&hellip;</p>
    <p v-else-if="errorMessage" role="alert" class="answers__status">
      Couldn't load articles. {{ errorMessage }}
    </p>
    <p v-else-if="visible.length === 0 && isSearching" class="answers__status">
      No articles match &ldquo;{{ query.trim() }}&rdquo;.
    </p>
    <p v-else-if="visible.length === 0" class="answers__status">No articles available.</p>

    <ul v-else class="answers__list">
      <li v-for="article in visible" :key="article.id">
        <ArticleCard :article="article" />
      </li>
    </ul>

    <PhilaButton
      v-if="nextPageToken && !isSearching"
      variant="secondary"
      type="button"
      class="answers__more"
      :disabled="isLoading"
      data-test="answers-more"
      @click="loadPage(nextPageToken)"
    >
      Load more
    </PhilaButton>
    </div>
  </main>
</template>

<style scoped>
.answers {
  height: 100%;
  overflow-y: auto;
}
.answers__hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 300px;
  padding: var(--spacing-xl, 2rem);
  color: #fff;
}
.answers__hero-photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.answers__hero::after {
  /* Legibility gradient over the photo, per Figma (transparent to black). */
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.75));
}
.answers__hero-text {
  position: relative;
  z-index: 1;
}
.answers__hero h1 {
  color: #fff;
  margin: 0 0 var(--spacing-xs, 0.5rem);
}
.answers__featured {
  /* Straddles the hero's bottom edge, per Figma. */
  position: relative;
  z-index: 1;
  max-width: 1080px;
  margin: -36px auto 0;
  padding: 0 var(--spacing-m, 1rem);
}
.answers__content {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--spacing-xl, 2rem) var(--spacing-m, 1rem);
}
.answers__more {
  margin: var(--spacing-l, 1.5rem) 0;
}
.answers__intro {
  margin-bottom: var(--spacing-m, 1rem);
}
.answers__search {
  position: relative;
  margin-bottom: var(--spacing-l, 1.5rem);
}
.answers__search-input {
  width: 100%;
  padding: var(--spacing-s, 0.75rem) 3rem var(--spacing-s, 0.75rem) var(--spacing-s, 0.75rem);
  background: #fff;
  border: 1px solid var(--ui-color-grey-300, #d6d6d6);
  border-radius: 8px;
  font-size: 1rem;
}
.answers__search-icon {
  position: absolute;
  right: var(--spacing-s, 0.75rem);
  top: 50%;
  transform: translateY(-50%);
  color: var(--ui-color-primary, #0f4d90);
  pointer-events: none;
}
.answers__chips {
  display: flex;
  gap: var(--spacing-s, 0.75rem);
  margin-bottom: var(--spacing-l, 1.5rem);
}
.answers__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2xs, 0.25rem);
  height: 32px;
  padding: 0 var(--spacing-xs, 0.5rem);
  background: #fff;
  border: 1px solid var(--ui-color-grey-300, #d6d6d6);
  border-radius: 16px;
}
.answers__chip-icon {
  font-size: 0.875rem;
}
.answers__chip-select {
  border: none;
  background: transparent;
  font: inherit;
  cursor: pointer;
}
.answers__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.answers__status {
  margin: var(--spacing-m, 1rem) 0;
}
</style>
