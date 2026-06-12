<!-- ABOUTME: Horizontal filter-chip row for the finder panel: leading "All Filters" chip,
     icon chips per service type, and a scroll chevron when the row overflows. -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSliders, faChevronRight } from '@fortawesome/pro-solid-svg-icons'
import { serviceTypeIconDefinition } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'

const props = defineProps<{
  options: { value: string; label: string }[]
  modelValue: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const rowRef = ref<HTMLElement | null>(null)
const canScroll = ref(false)

function updateOverflow() {
  const row = rowRef.value
  canScroll.value = !!row && row.scrollWidth > row.clientWidth + 1
}

function scrollRight() {
  const row = rowRef.value
  if (!row) return
  row.scrollBy({ left: Math.round(row.clientWidth * 0.8), behavior: 'smooth' })
}

onMounted(() => {
  updateOverflow()
  window.addEventListener('resize', updateOverflow)
})
onBeforeUnmount(() => window.removeEventListener('resize', updateOverflow))
</script>

<template>
  <div class="filter-chips">
    <div ref="rowRef" class="filter-chips__row">
      <button
        type="button"
        class="filter-chips__chip"
        :class="{ 'filter-chips__chip--selected': modelValue === 'all' }"
        :aria-pressed="modelValue === 'all'"
        @click="emit('update:modelValue', 'all')"
      >
        <FontAwesomeIcon :icon="faSliders" />
        All Filters
      </button>
      <button
        v-for="opt in props.options"
        :key="opt.value"
        type="button"
        class="filter-chips__chip"
        :class="{ 'filter-chips__chip--selected': modelValue === opt.value }"
        :aria-pressed="modelValue === opt.value"
        @click="emit('update:modelValue', opt.value)"
      >
        <FontAwesomeIcon
          :icon="serviceTypeIconDefinition(opt.label)"
          :style="{ color: serviceTypeColor(opt.label) }"
        />
        {{ opt.label }}
      </button>
    </div>
    <button
      v-if="canScroll"
      type="button"
      class="filter-chips__scroll"
      aria-label="Scroll filters"
      @click="scrollRight"
    >
      <FontAwesomeIcon :icon="faChevronRight" />
    </button>
  </div>
</template>

<style scoped>
.filter-chips {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-m, 1rem) var(--spacing-s, 0.75rem);
}
.filter-chips__row {
  display: flex;
  gap: var(--spacing-xs, 0.5rem);
  overflow-x: auto;
  scrollbar-width: none;
  white-space: nowrap;
}
.filter-chips__row::-webkit-scrollbar {
  display: none;
}
.filter-chips__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  padding: 6px 12px;
  border: 1px solid var(--ui-color-grey-300, #d6d6d6);
  border-radius: 9999px;
  background: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}
.filter-chips__chip--selected {
  background: var(--ui-color-primary, #0f4d90);
  border-color: var(--ui-color-primary, #0f4d90);
  color: #fff;
}
.filter-chips__chip--selected :deep(svg) {
  color: #fff !important;
}
.filter-chips__scroll {
  flex: none;
  margin-left: var(--spacing-xs, 0.5rem);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--ui-color-grey-300, #d6d6d6);
  background: #fff;
  cursor: pointer;
}
</style>
