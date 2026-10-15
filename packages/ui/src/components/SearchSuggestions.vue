<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon, type IconComponent } from '@phila/phila-ui-core'
import { IconLocationCrosshairs } from '@phila/phila-ui-core/icons'
import { CloseButton, PhilaButton } from '@phila/phila-ui-button'

const locatingUser = defineModel<boolean>('locatingUser', {
  default: false,
})

const props = withDefaults(
  defineProps<{
    searchFocused: boolean
    suggestions: string[]
    history: string[]
    showGeolocate?: boolean
    heading?: string
    removeLabel?: string
    icon?: IconComponent
  }>(),
  {
    showGeolocate: false,
    heading: undefined,
    removeLabel: undefined,
    icon: undefined,
  }
)

const emit = defineEmits<{
  select: [suggestion: string]
  remove: [suggestion: string]
}>()

// slots
const slots = defineSlots<{
  'suggestion-card'?: unknown
}>()

const activeIndex = ref(-1)
const listRef = ref<HTMLUListElement | null>(null)
const removable = ref(true)
const dropdownSuggections = ref(props.history)

watch(
  () => props.suggestions,
  (newSuggestions) => {
    if (newSuggestions.length) {
      removable.value = false
      dropdownSuggections.value = newSuggestions
      activeIndex.value = -1
    } else {
      removable.value = true
      dropdownSuggections.value = props.history
    }
  }
)

watch(
  () => props.history,
  (updated) => {
    dropdownSuggections.value = updated
  }
)

function focusItem(index: number) {
  const items = listRef.value?.querySelectorAll<HTMLElement>('.search-suggestion')
  items?.[index]?.focus()
}

function focusFirst() {
  if (props.suggestions.length) {
    activeIndex.value = 0
    focusItem(0)
  }
}

function handleKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowDown': {
      event.preventDefault()
      const next = Math.min(activeIndex.value + 1, props.suggestions.length - 1)
      activeIndex.value = next
      focusItem(next)
      break
    }
    case 'ArrowUp': {
      event.preventDefault()
      if (activeIndex.value <= 0) {
        activeIndex.value = -1
      } else {
        activeIndex.value -= 1
        focusItem(activeIndex.value)
      }
      break
    }
    case 'Enter': {
      const target = event.target as HTMLElement
      if (target.closest('.search-suggestion-remove')) break
      event.preventDefault()
      if (activeIndex.value >= 0) {
        emit('select', props.suggestions[activeIndex.value])
      }
      break
    }
  }
}

defineExpose({ focusFirst })
</script>

<template>
  <div class="search-suggestions-panel">
    <span v-if="showGeolocate && !suggestions.length" class="geolocate_button">
      <PhilaButton
        text="Use my current location"
        size="extra-small"
        :icon="IconLocationCrosshairs"
        :loading="locatingUser"
        @click="locatingUser = true"
      />
    </span>
    <template v-if="slots['suggestion-card'] && !suggestions.length">
      <slot name="suggestion-card" />
    </template>
    <ul ref="listRef" class="search-suggestions" role="listbox" @keydown="handleKeydown">
      <li
        v-if="removable && history.length"
        class="search-suggestions-heading has-text-label-default"
        role="presentation"
        v-text="heading"
      />
      <li
        v-for="(suggestion, index) in dropdownSuggections"
        :key="suggestion"
        class="search-suggestion"
        :class="{ 'search-suggestion--active': index === activeIndex }"
        role="option"
        tabindex="0"
        @click="emit('select', suggestion)"
      >
        <Icon v-if="icon" :icon="icon" inline decorative />
        <span class="search-suggestion-text has-text-body-default" v-text="suggestion" />
        <CloseButton
          v-if="removable"
          :aria-label="removeLabel"
          @click.stop="emit('remove', suggestion)"
        />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.search-suggestions-panel {
  display: grid;
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--Schemes-Background, #fff);
  border: 0px dotted var(--Schemes-Border-low, #ccc);
  clip-path: inset(0 -8px -8px -8px);
  max-height: 40dvh;
  overflow: auto;
  scrollbar-width: thin;
}

.geolocate_button {
  padding: var(--spacing-m, 1rem);

  & > button > :is(.phila-button__stack) > :is(.phila-button__content) > :is(.phila-icon-core) {
    font-size: var(--Icon-Solid-Small-font-icon-solid-small-size, 1.125rem);
  }
}

.search-suggestions {
  padding: var(--spacing-xs, 0.5rem) var(--spacing-l, 1.5rem);
  list-style: none;
  overflow: auto;
  scrollbar-width: thin;

  &,
  li {
    margin: var(--spacing-none, 0);
  }
}

.search-suggestions-heading {
  padding-bottom: var(--spacing-xs, 0.5rem);
}

.search-suggestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xs, 0.5rem);
  cursor: pointer;
  outline: transparent;
}

.search-suggestion:not(:last-child) {
  padding-bottom: var(--spacing-2xs, 0.25rem);
}

.search-suggestion:last-child {
  padding-bottom: var(--spacing-3xs, 0.125rem);
}

.search-suggestion-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-suggestion:hover,
.search-suggestion:focus-visible,
.search-suggestion--active {
  background-color: var(--Schemes-Surface-Container-Low, #f5f5f5);
}
</style>
