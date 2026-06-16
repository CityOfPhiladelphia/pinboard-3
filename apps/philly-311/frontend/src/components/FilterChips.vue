<!-- ABOUTME: Horizontal filter-chip row for the finder panel: leading "All Filters" chip,
     icon chips per service type, mouse drag-to-scroll, and floating left/right chevrons
     with edge fades shown when the row can scroll that direction. -->
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSliders, faChevronLeft, faChevronRight } from '@fortawesome/pro-solid-svg-icons'
import { serviceTypeIconDefinition } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'

const props = defineProps<{
  options: { value: string; label: string }[]
  modelValue: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const rowRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateScroll() {
  const row = rowRef.value
  if (!row) {
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  canScrollLeft.value = row.scrollLeft > 1
  canScrollRight.value = row.scrollLeft + row.clientWidth < row.scrollWidth - 1
}

function scrollByDir(dir: 1 | -1) {
  const row = rowRef.value
  if (!row) return
  row.scrollBy({ left: Math.round(row.clientWidth * 0.8) * dir, behavior: 'smooth' })
}

const DRAG_THRESHOLD = 5
let pointerActive = false
let startX = 0
let startScrollLeft = 0
const dragged = ref(false)

function onPointerDown(e: PointerEvent) {
  const row = rowRef.value
  if (!row || e.pointerType === 'touch' || e.button !== 0) return
  pointerActive = true
  dragged.value = false
  startX = e.clientX
  startScrollLeft = row.scrollLeft
  row.setPointerCapture?.(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  const row = rowRef.value
  if (!pointerActive || !row) return
  const dx = e.clientX - startX
  if (Math.abs(dx) > DRAG_THRESHOLD) dragged.value = true
  row.scrollLeft = startScrollLeft - dx
}

function onPointerUp(e: PointerEvent) {
  if (!pointerActive) return
  pointerActive = false
  rowRef.value?.releasePointerCapture?.(e.pointerId)
}

function onChipClick(value: string) {
  if (dragged.value) return
  emit('update:modelValue', value)
}

let observer: ResizeObserver | null = null

onMounted(() => {
  updateScroll()
  if (rowRef.value) {
    observer = new ResizeObserver(() => updateScroll())
    observer.observe(rowRef.value)
  }
})
onBeforeUnmount(() => observer?.disconnect())
watch(
  () => props.options,
  () => nextTick(updateScroll),
  { deep: true },
)
</script>

<template>
  <div class="filter-chips">
    <div class="filter-chips__viewport">
      <div
        ref="rowRef"
        class="filter-chips__row"
        role="group"
        aria-label="Filter reports by type"
        @scroll="updateScroll"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <button
          type="button"
          class="filter-chips__chip"
          :class="{ 'filter-chips__chip--selected': modelValue === 'all' }"
          :aria-pressed="modelValue === 'all'"
          @click="onChipClick('all')"
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
          @click="onChipClick(opt.value)"
        >
          <FontAwesomeIcon
            :icon="serviceTypeIconDefinition(opt.label)"
            :style="{ color: modelValue === opt.value ? '#fff' : serviceTypeColor(opt.label) }"
          />
          {{ opt.label }}
        </button>
      </div>

      <div
        v-show="canScrollLeft"
        class="filter-chips__fade filter-chips__fade--left"
        aria-hidden="true"
      />
      <div
        v-show="canScrollRight"
        class="filter-chips__fade filter-chips__fade--right"
        aria-hidden="true"
      />

      <button
        v-if="canScrollLeft"
        type="button"
        class="filter-chips__scroll filter-chips__scroll--left"
        aria-label="Scroll filters left"
        @click="scrollByDir(-1)"
      >
        <FontAwesomeIcon :icon="faChevronLeft" />
      </button>
      <button
        v-if="canScrollRight"
        type="button"
        class="filter-chips__scroll filter-chips__scroll--right"
        aria-label="Scroll filters right"
        @click="scrollByDir(1)"
      >
        <FontAwesomeIcon :icon="faChevronRight" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-chips {
  padding: 0 var(--spacing-m, 1rem) var(--spacing-s, 0.75rem);
}
.filter-chips__viewport {
  position: relative;
}
.filter-chips__row {
  display: flex;
  gap: var(--spacing-xs, 0.5rem);
  overflow-x: auto;
  scrollbar-width: none;
  white-space: nowrap;
  cursor: grab;
  user-select: none;
  touch-action: pan-x;
}
.filter-chips__row:active {
  cursor: grabbing;
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
.filter-chips__fade {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 48px;
  pointer-events: none;
  z-index: 1;
}
.filter-chips__fade--left {
  left: 0;
  background: linear-gradient(to right, var(--filter-chips-bg, #fff), transparent);
}
.filter-chips__fade--right {
  right: 0;
  background: linear-gradient(to left, var(--filter-chips-bg, #fff), transparent);
}
.filter-chips__scroll {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--ui-color-grey-300, #d6d6d6);
  background: #fff;
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.filter-chips__scroll--left {
  left: 0;
}
.filter-chips__scroll--right {
  right: 0;
}
</style>
