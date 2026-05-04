<!-- LocationSearchFilterPanel -->
<!--
Component for rendering the features search bar, filter buttons, and sort buttons inside of location panel.
Because not all finders will use the exact some layout, search, filter and sort are all optional.
Search, filter, and sort will only render if a prop for them is passed into LocationSearchFilterPanel

Features in component have minimal state and logic.
They will emit current values, and the logic for handling those values will be done in the parent app.

To render a feature:
  Search: string - placeholder string to render inside search bar
  Filter: string[] - array of string to match
  Sort: SortLocationsOptions - Object that will be converted into MenuOption[]
 -->

<script setup lang="ts">
// vue imports
import { ref, computed } from 'vue'

// 3rd party imports
// philly ui imports
import { Search } from '@phila/phila-ui-search'
import { Menu } from '@phila/phila-ui-menu'

// pinboard component imports
import LocationFilter from './LocationFilter.vue'
import SearchSuggestions from './SearchSuggestions.vue'

// pinboard composables imports
import { useSearchSuggestions } from '../composables/useSearchSuggestions'

// type imports
import type {
  LocationFilterOption,
  SortLocationsOptions,
  MenuOption,
} from '../types'

// props
const props = defineProps<{
  searchPlaceholder?: string
  filterOptions?: LocationFilterOption[]
  sortOptions?: SortLocationsOptions
}>()

// emits

const emit = defineEmits<{
  search: []
  searchString: [search: string]
  selectedFilter: [filter: string]
  sortOption: [sort: string]
}>()

// refs
const sortOption = ref<string>('')
const searchString = ref<string>('')
const searchWrapperRef = ref<HTMLElement | null>(null)
const suggestionsRef = ref<InstanceType<typeof SearchSuggestions> | null>(null)
const { searchSuggestions, searchSuggestionsError, dismissSuggestions } =
  useSearchSuggestions(searchString)

// computed refs
const sortChoices = computed(() => {
  const sortOptions = props.sortOptions ?? {}
  const choices: MenuOption[] = Array.from(
    Object.keys(sortOptions),
    (option, i) => {
      return {
        text: Object.values(sortOptions)[i],
        value: option,
      }
    }
  )
  return choices
})

// event handlers
function handleFilterChange(option: string) {
  emit('selectedFilter', option)
}

function handleSortChange(value: string | string[]) {
  value = Array.isArray(value) ? (value[0] ?? '') : value
  sortOption.value = value ?? ''
  emit('sortOption', sortOption.value)
}

function handleSearchChange(search: string) {
  emit('searchString', search)
  searchString.value = search
}

function handleSuggestionSelect(suggestion: string) {
  dismissSuggestions()
  searchString.value = suggestion
  emit('searchString', suggestion)
  emit('search')
  focusSearchInput()
}

function handleSearchKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  if (
    event.key === 'ArrowDown' &&
    searchSuggestions.value.length &&
    target.tagName === 'INPUT'
  ) {
    event.preventDefault()
    suggestionsRef.value?.focusFirst()
  }
}

function handleSuggestionDismiss() {
  focusSearchInput()
}

function focusSearchInput() {
  const input = searchWrapperRef.value?.querySelector<HTMLElement>('input')
  input?.focus()
}

// utility functions
</script>

<template>
  <div class="location-search-filter-sort">
    <div
      v-if="searchPlaceholder"
      ref="searchWrapperRef"
      class="location-search"
      @keydown="handleSearchKeydown"
    >
      <Search
        v-model="searchString"
        :placeholder="searchPlaceholder"
        @update:model-value="handleSearchChange"
        @search="emit('search')"
      />
      <SearchSuggestions
        ref="suggestionsRef"
        :suggestions="searchSuggestions"
        @select="handleSuggestionSelect"
        @dismiss="handleSuggestionDismiss"
      />
    </div>
    <LocationFilter
      v-if="filterOptions"
      class="location-filters"
      :filter-options="filterOptions"
      @selected-filter="handleFilterChange"
    />
    <div class="location-sort">
      <Menu
        v-if="sortOptions"
        :choices="sortChoices"
        placeholder="Sort"
        @update:model-value="handleSortChange"
      />
    </div>
  </div>
</template>

<style scoped>
.location-search-filter-sort {
  display: grid;
  grid-template:
    'search search'
    'filters sort';
}

.location-search {
  grid-area: search;
  padding: 1rem 1rem 0rem 1rem;
  width: 100%;
}

.location-search :deep(.search) {
  width: 100%;
}

.location-filters {
  grid-area: filters;
}

.location-sort {
  grid-area: sort;
  margin-left: auto;
  padding-right: 1rem;
}
</style>
