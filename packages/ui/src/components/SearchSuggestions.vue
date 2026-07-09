<script setup lang="ts">
import { ref, watch } from 'vue'
import { Icon } from '@phila/phila-ui-core'
import { IconClose } from '@phila/phila-ui-core/icons'

const props = defineProps<{
  suggestions: string[]
  heading?: string
  removable?: boolean
  removeLabel?: string
}>()

const emit = defineEmits<{
  select: [suggestion: string]
  dismiss: []
  remove: [suggestion: string]
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
  <div v-if="suggestions.length" class="search-suggestions-anchor">
    <ul ref="listRef" class="search-suggestions" role="listbox" @keydown="handleKeydown">
      <li v-if="heading" class="search-suggestions-heading" role="presentation">
        {{ heading }}
      </li>
      <li
        v-for="(suggestion, index) in suggestions"
        :key="suggestion"
        class="search-suggestion"
        :class="{ 'search-suggestion--active': index === activeIndex }"
        role="option"
        tabindex="-1"
        @click="emit('select', suggestion)"
      >
        <span class="search-suggestion-text">{{ suggestion }}</span>
        <button
          v-if="removable"
          type="button"
          class="search-suggestion-remove"
          :aria-label="removeLabel"
          @click.stop="emit('remove', suggestion)"
        >
          <Icon :icon="IconClose" decorative />
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.search-suggestions-anchor {
  position: relative;
  width: 100%;
  height: 0;
}

.search-suggestions {
  list-style: none;
  margin: 0;
  padding: 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: var(--Schemes-Background, #fff);
  border: 1px solid var(--Schemes-Border-low, #ccc);
  border-top: none;
  border-radius: 0 0 var(--border-radius-s, 4px) var(--border-radius-s, 4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-height: 15rem;
  overflow-y: auto;
  z-index: 10;
}

.search-suggestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xs, 0.5rem);
  padding: var(--spacing-2xs, 0.25rem) var(--spacing-xs, 0.5rem);
  cursor: pointer;
  color: var(--Schemes-On-Surface, #000);
  font-family: var(--Body-Large-font-body-large-family);
  font-size: var(--Body-Large-font-body-large-size);
  line-height: var(--Body-Large-font-body-large-lineheight);
  outline: none;
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

.search-suggestion-remove {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.15rem;
  border: none;
  background: transparent;
  color: var(--Schemes-On-Surface-Variant, #555);
  cursor: pointer;
  border-radius: var(--border-radius-s, 4px);
}

.search-suggestion-remove:hover {
  background: var(--Schemes-Surface-Container, #eee);
}
</style>
