<!-- ABOUTME: AIS-backed address search. Typing fires /autocomplete (debounced);
     picking a result fires /search to resolve coords and emits select(feature). -->
<script setup lang="ts">
import { ref } from 'vue'
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

const { query, results, loading, error } = useDebouncedSearch<AisAutocompleteResult[]>({
  initial: [],
  fetcher: (q, signal) => autocompleteAddresses(q, signal),
})

// Closed after a pick: echoing the resolved address into `query` re-fires the
// debounced autocomplete, and the list must not reopen until the user types.
const open = ref(false)

// True while searchAddress is resolving a picked result (open is false during this).
const resolving = ref(false)

function onInput(e: Event) {
  query.value = (e.target as HTMLInputElement).value
  open.value = true
}

async function pick(r: AisAutocompleteResult) {
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
      error.value = "Couldn't resolve that address."
    }
  } catch (err) {
    error.value = (err as Error).message ?? String(err)
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
        aria-label="Address"
        placeholder="Enter an address, intersection, or place"
        autocomplete="off"
        @input="onInput"
      />
      <FontAwesomeIcon :icon="faMagnifyingGlass" class="address-search__icon" />
    </div>
    <p v-if="(open && loading) || resolving" class="address-search__loading">Searching&hellip;</p>
    <p v-if="error" class="address-search__error">{{ error }}</p>
    <ul v-if="open && results.length" class="address-search__results" role="listbox">
      <li v-for="r in results" :key="r.searchAddress" role="option">
        <button type="button" @click="pick(r)">
          <FontAwesomeIcon :icon="faLocationDot" class="address-search__pin" />
          <span class="address-search__lines">
            <span class="address-search__address">{{ r.address }}</span>
            <span class="address-search__city">Philadelphia, PA</span>
          </span>
        </button>
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
.address-search__results button {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  width: 100%;
  padding: 10px 12px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
}
.address-search__results button:hover {
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
