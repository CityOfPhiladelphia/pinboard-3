<!-- ABOUTME: Pill-shaped call-to-action button. Renders a <button> by default, or a
     RouterLink when `to` is set; primary (filled) and outline variants. -->
<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'outline'
    to?: RouteLocationRaw
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
  }>(),
  { variant: 'primary', type: 'button', disabled: false },
)

const tag = computed(() => (props.to !== undefined ? RouterLink : 'button'))
</script>

<template>
  <component
    :is="tag"
    class="pill-button"
    :class="`pill-button--${variant}`"
    :to="to"
    :type="to === undefined ? type : undefined"
    :disabled="to === undefined ? disabled : undefined"
  >
    <slot />
  </component>
</template>

<style scoped>
.pill-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4em;
  padding: var(--spacing-s, 0.5rem) var(--spacing-l, 1.5rem);
  border-radius: 9999px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}
.pill-button--primary {
  background: var(--ui-color-primary, #0f4d90);
  color: #fff;
  border: none;
}
.pill-button--outline {
  background: #fff;
  color: var(--ui-color-primary, #0f4d90);
  border: 1px solid var(--ui-color-primary, #0f4d90);
}
.pill-button:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
