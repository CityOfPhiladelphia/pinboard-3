<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon, type IconComponent } from '@phila/phila-ui-core'
import { IconLocationCrosshairs } from '@phila/phila-ui-core/icons'
import { CloseButton, PhilaButton } from '@phila/phila-ui-button'
import type { UserLocationState } from '../types'

const userLocationState = defineModel<UserLocationState>('user-location-state', {
  default: 'unknown',
})

const props = withDefaults(
  defineProps<{
    suggestions: string[]
    showGeolocate?: boolean
    heading?: string
    removable?: boolean
    removeLabel?: string
    icon?: IconComponent
  }>(),
  {
    showGeolocate: true,
    heading: undefined,
    removable: true,
    removeLabel: undefined,
    icon: undefined,
  }
)

const emit = defineEmits<{
  select: [suggestion: string]
  remove: [suggestion: string]
  dismiss: []
}>()

const activeIndex = ref(-1)
const listRef = ref<HTMLUListElement | null>(null)

watch(
  () => props.suggestions,
  () => {
    activeIndex.value = -1
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
        emit('dismiss')
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
    case 'Escape': {
      event.preventDefault()
      emit('dismiss')
      break
    }
  }
}

defineExpose({ focusFirst })
</script>

<template>
  <div v-if="suggestions.length" class="search-suggestions-panel">
    <span class="geolocate_button">
      <PhilaButton
        text="Use my current location"
        size="extra-small"
        :icon="IconLocationCrosshairs"
        :loading="userLocationState === 'acquiring'"
        @click="userLocationState = 'acquiring'"
      />
    </span>
    <slot />
    <ul ref="listRef" class="search-suggestions" role="listbox" @keydown="handleKeydown">
      <li v-if="heading" class="search-suggestions-heading" role="presentation" v-text="heading" />
      <li
        v-for="(suggestion, index) in suggestions"
        :key="suggestion"
        class="search-suggestion"
        :class="{ 'search-suggestion--active': index === activeIndex }"
        role="option"
        tabindex="0"
        @click="emit('select', suggestion)"
      >
        <Icon v-if="icon" :icon="icon" inline decorative />
        <span class="search-suggestion-text has-text-label-default" v-text="suggestion" />
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
}

.geolocate_button {
  padding: var(--spacing-m, 1rem);

  & > button > :is(.phila-button__stack) > :is(.phila-button__content) > :is(.phila-icon-core) {
    font-size: var(--Icon-Solid-Small-font-icon-solid-small-size, 1.125rem);
  }
}

.search-suggestions {
  padding: 0 1.05rem;
  list-style: none;
  height: 100%;
  overflow: auto;
  scrollbar-width: thin;
}

.search-suggestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
  gap: var(--spacing-xs, 0.5rem);
  padding: var(--spacing-2xs, 0.25rem) var(--spacing-xs, 0.5rem);
  cursor: pointer;
  color: var(--Schemes-On-Surface, #000);
  font-family: var(--Body-Large-font-body-large-family);
  font-size: var(--Body-Large-font-body-large-size);
  line-height: var(--Body-Large-font-body-large-lineheight);
  outline: transparent;
}

.search-suggestion:hover,
.search-suggestion:focus,
.search-suggestion--active {
  background-color: var(--Schemes-Surface-Container-Low, #f5f5f5);
}

.search-suggestions-heading {
  padding: var(--spacing-2xs, 0.25rem) var(--spacing-xs, 0.5rem);
  color: var(--Schemes-On-Surface-Variant, #555);
  font-family: var(--Label-Default-font-label-default-family);
  font-size: var(--Label-Default-font-label-default-size);
  font-weight: 700;
}

.search-suggestion-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
