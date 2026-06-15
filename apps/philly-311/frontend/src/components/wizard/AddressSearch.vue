<!-- ABOUTME: AIS-backed address search. Typing fires /autocomplete (debounced);
     picking a result fires /search to resolve coords and emits select(feature). -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faLocationDot, faMagnifyingGlass } from '@fortawesome/pro-solid-svg-icons'
import { useDebouncedSearch } from '@/composables/useDebouncedSearch'
import {
  autocompleteAddresses,
  searchAddress,
  type AisAutocompleteResult,
  type AisFeature,
} from '@/composables/useAis'

const emit = defineEmits<{ select: [feature: AisFeature] }>()

const RESOLVE_ERROR = "Couldn't resolve that address."

const { query, results, loading, error } = useDebouncedSearch<AisAutocompleteResult[]>({
  initial: [],
  fetcher: (q, signal) => autocompleteAddresses(q, signal),
})

// Closed after a pick: echoing the resolved address into `query` re-fires the
// debounced autocomplete, and the list must not reopen until the user types.
const open = ref(false)

// True while searchAddress is resolving a picked result (open is false during this).
const resolving = ref(false)

const LISTBOX_ID = 'address-search-listbox'
const activeIndex = ref(-1)

const isOpen = computed(() => open.value && results.value.length > 0)
const activeId = computed(() =>
  activeIndex.value >= 0 ? `address-option-${activeIndex.value}` : undefined,
)

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  open.value = true
  activeIndex.value = -1
}

function move(delta: number) {
  if (!isOpen.value) return
  const n = results.value.length
  activeIndex.value = (activeIndex.value + delta + n) % n
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!isOpen.value && results.value.length) open.value = true
    move(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    move(-1)
  } else if (e.key === 'Enter') {
    if (isOpen.value && activeIndex.value >= 0) {
      e.preventDefault()
      void pick(results.value[activeIndex.value])
    }
  } else if (e.key === 'Escape') {
    open.value = false
    activeIndex.value = -1
  }
}

async function pick(r: AisAutocompleteResult) {
  activeIndex.value = -1
  open.value = false
  resolving.value = true
  error.value = null
  try {
    const feature = await searchAddress(r.searchAddress)
    if (feature) {
      emit('select', feature)
      query.value = feature.streetAddress
      results.value = []
    } else {
      error.value = RESOLVE_ERROR
    }
  } catch {
    error.value = RESOLVE_ERROR
  } finally {
    resolving.value = false
  }
}
</script>

<template>
  <div class="address-search">
    <div class="address-search__box">
      <input
        id="address-search-input"
        :value="query"
        type="search"
        role="combobox"
        aria-label="Address"
        aria-autocomplete="list"
        :aria-controls="LISTBOX_ID"
        :aria-expanded="isOpen ? 'true' : 'false'"
        :aria-activedescendant="activeId"
        placeholder="Enter an address, intersection, or place"
        autocomplete="off"
        @input="onInput"
        @keydown="onKeydown"
      />
      <FontAwesomeIcon :icon="faMagnifyingGlass" class="address-search__icon" />
    </div>
    <p v-if="(open && loading) || resolving" class="address-search__loading">Searching&hellip;</p>
    <p v-if="error" class="address-search__error">{{ error }}</p>
    <ul v-if="isOpen" :id="LISTBOX_ID" class="address-search__results" role="listbox">
      <li
        v-for="(r, i) in results"
        :id="`address-option-${i}`"
        :key="r.searchAddress"
        role="option"
        class="address-search__option"
        :class="{ 'address-search__option--active': i === activeIndex }"
        :aria-selected="i === activeIndex ? 'true' : 'false'"
        @click="pick(r)"
        @mouseenter="activeIndex = i"
      >
        <FontAwesomeIcon :icon="faLocationDot" class="address-search__pin" />
        <span class="address-search__lines">
          <span class="address-search__address">{{ r.address }}</span>
          <span class="address-search__city">Philadelphia, PA</span>
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.address-search__box {
  position: relative;
}
.address-search__box input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 40px 10px 12px;
  border: 1px solid var(--ui-color-grey-400, #a1a1a1);
  border-radius: 8px;
  font-size: 1rem;
}
.address-search__icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ui-color-primary, #0f4d90);
}
.address-search__results {
  list-style: none;
  margin: var(--spacing-xs, 0.5rem) 0 0;
  padding: 0;
  border: 1px solid var(--ui-color-grey-200, #e3e3e3);
  border-radius: 8px;
  overflow: hidden;
}
.address-search__results li + li {
  border-top: 1px solid var(--ui-color-grey-200, #e3e3e3);
}
.address-search__option {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  width: 100%;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
}
.address-search__option--active {
  background: var(--ui-color-grey-100, #f5f5f5);
}
.address-search__pin {
  flex: none;
}
.address-search__lines {
  display: flex;
  flex-direction: column;
}
.address-search__address {
  font-weight: 600;
}
.address-search__city {
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
.address-search__loading,
.address-search__error {
  margin: var(--spacing-xs, 0.5rem) 0 0;
  font-size: 0.875rem;
}
.address-search__error {
  color: var(--ui-color-red, #c0392b);
}
</style>
