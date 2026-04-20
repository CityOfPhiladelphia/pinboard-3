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
  Sort: enum -
 -->

<script setup lang="ts">
import { ref, computed, ComputedRef } from 'vue'
import { Search } from '@phila/phila-ui-search'
import { Tags } from '@phila/phila-ui-tags'
import { Menu } from '@phila/phila-ui-menu'
import type {
  LocationFilterOption,
  SearchMode,
  SortLocationsOptions,
  AisAutocompleteResult,
  MenuOption,
} from '../types'
import { StreetAddress, Zipcode } from '../types'

const props = defineProps<{
  searchPlaceholder?: string
  filterOptions?: LocationFilterOption[]
  sortOptions?: SortLocationsOptions
}>()

const emit = defineEmits<{
  searchString: [search: string]
  selectedFilter: [filter: string]
  sortOption: [sort: string]
  searchMode: [mode: string]
}>()

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

const selectedFilter = ref(
  props.filterOptions ? props.filterOptions[0].value : undefined
)
const sortOption = ref<string>('')
const searchString = ref<string>('')
const searchSuggestions = ref<string[]>([])

const searchMode: ComputedRef<SearchMode> = computed(() => {
  switch (true) {
    case StreetAddress.test(searchString.value): {
      return 'address'
    }
    case Zipcode.test(searchString.value): {
      return 'zipcode'
    }
    case searchString.value !== '': {
      return 'keyword'
    }
    default: {
      return false
    }
  }
})

async function updateSearchSuggestions(): Promise<string[]> {
  if (
    searchString.value.length < 3 ||
    !/^\d{1,5}(?:-\d{1,5})?(?: [NnSs])? [A-Za-z ]*/.test(searchString.value)
  ) {
    return []
  }
  const suggestions: AisAutocompleteResult = await (
    await fetch(
      `https://ais-autocomplete.citygeo.phila.city/autocomplete?q=${searchString.value.replace(/ /, '+')}`
    )
  ).json()
  const suggestedAddresses = suggestions.count
    ? Array.from(
        suggestions.results.addresses,
        (suggestion) => suggestion.address
      )
    : []
  return suggestedAddresses
}

function handleFilterChange(option: string) {
  if (selectedFilter.value === option) {
    return
  }
  selectedFilter.value = option
  emit('selectedFilter', selectedFilter.value)
}

function handleSortChange(value: string | string[]) {
  value = Array.isArray(value) ? value[0] : value
  sortOption.value = value ?? ''
  emit('sortOption', sortOption.value)
}

async function handleSearchChange(search: string) {
  searchString.value = search
  searchSuggestions.value = await updateSearchSuggestions()
  if (searchSuggestions.value.length) {
    console.log('handleSearchChange:', searchSuggestions.value)
  }
  if (searchMode.value && searchString.value === '') {
    emit('searchString', searchString.value)
  }
}

function handleSearchSubmit() {
  emit('searchString', searchString.value)
}
</script>

<template>
  <div>
    <Search
      v-if="searchPlaceholder"
      class-name="location-search"
      :placeholder="searchPlaceholder"
      @update:modelValue="handleSearchChange"
      @search="handleSearchSubmit"
    />
    <!-- <Menu
      v-if="searchSuggestions.length"
      class="location-search-autocomplete"
      :choices="searchSuggestions"
    /> -->
    <!-- Make new component for search suggestions -->
  </div>

  <div class="location-filters">
    <Tags
      v-for="opt in filterOptions"
      :key="`filter-${opt.value}`"
      variant="action"
      size="large"
      color="grey"
      :text="opt.label"
      :selected="selectedFilter === opt.value"
      @update:selected="handleFilterChange(opt.value)"
    />
    <Menu
      v-if="sortOptions"
      :choices="sortChoices"
      placeholder="Sort"
      className="location-sort"
      @update:modelValue="handleSortChange"
    />
  </div>
</template>

<style scoped>
.location-search {
  padding: 1rem 1rem 0rem 1rem;
  width: 100%;
}

.location-search-autocomplete {
  width: 100%;
}

.location-filters {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}

.location-sort {
  margin-left: auto;
}
</style>
