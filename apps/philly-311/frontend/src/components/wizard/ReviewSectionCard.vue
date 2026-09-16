<!-- ABOUTME: Card chrome for one Review-step section: a checkmark-badged header
     with an icon + label and an Edit button, a divider, then the section's own
     content in the default slot. -->
<script setup lang="ts">
import { Icon, type IconComponent } from '@phila/phila-ui-core'
import { IconCheck, IconPencil } from '@phila/phila-ui-core/icons'
import { PhilaButton } from '@phila/phila-ui-button'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  icon: IconComponent
  label: string
  /** Omit to have Edit emit `edit` instead of navigating — for sections whose
   *  editor is a modal rather than another wizard step. */
  editTo?: RouteLocationRaw
  editLabel: string
}>()
defineEmits<{ edit: [] }>()
</script>

<template>
  <section class="review-section-card">
    <header class="review-section-card__header">
      <div class="review-section-card__title">
        <span class="review-section-card__check" aria-hidden="true">
          <Icon :icon="IconCheck" decorative size="xxsmall" />
        </span>
        <Icon :icon="icon" decorative size="small" />
        <h2 class="review-section-card__heading">{{ label }}</h2>
      </div>
      <PhilaButton
        v-if="editTo"
        variant="text"
        size="extra-small"
        :icon="IconPencil"
        :to="editTo"
        :aria-label="editLabel"
      >
        Edit
      </PhilaButton>
      <PhilaButton
        v-else
        type="button"
        variant="text"
        size="extra-small"
        :icon="IconPencil"
        :aria-label="editLabel"
        @click="$emit('edit')"
      >
        Edit
      </PhilaButton>
    </header>
    <div class="review-section-card__divider" />
    <div class="review-section-card__content">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.review-section-card {
  width: 100%;
  border: 1px solid var(--Schemes-Border-low, #ccc);
  border-radius: var(--border-radius-xl, 24px);
  box-sizing: border-box;
}
.review-section-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-m, 1rem) var(--spacing-l, 1.5rem);
}
.review-section-card__title {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
}
.review-section-card__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--border-radius-full, 9999px);
  background: var(--Palettes-Success-Success-700, #c8eacb);
  color: var(--Palettes-Success-Success-300, #036222);
}
.review-section-card__heading {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}
.review-section-card__divider {
  border-top: 1px solid var(--Schemes-Border-low, #ccc);
}
.review-section-card__content {
  padding: var(--spacing-l, 1.5rem);
  width: 100%;
  box-sizing: border-box;
}
</style>
