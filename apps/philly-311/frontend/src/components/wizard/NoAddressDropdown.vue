<!-- ABOUTME: Wizard step 3 — location. AIS address search is primary; a persistent
     map shows the chosen point with a draggable pin; "Use my current location" uses
     browser geolocation. Stores a complete AisFeature; Next gated on in-Philly. -->
<script setup lang="ts">
import { PhilaButton } from '@phila/phila-ui-button'
import { Icon } from '@phila/phila-ui-core'
import { IconRotateLeft, IconLocationDot, IconArrowRight } from '@phila/phila-ui-core/icons'

const emit = defineEmits<{
  (e: 'reset'): void
}>()
</script>

<template>
  <div class="no-address">
    <Icon
      :icon="IconLocationDot"
      size="extra-large"
      decorative
      inline
      class="no-address__header_icon"
    />
    <span class="has-text-label-large no-address__header_text" v-text="'No address found'" />
    <span
      class="has-text-body-default no-address__header_subtext"
      v-text="'Try another address or continue with manual entry'"
    />
    <PhilaButton
      :icon="IconArrowRight"
      text="Continue with address anyway"
      size="extra-small"
      icon-right
      class="no-address__header_continue"
    />
    <PhilaButton :icon="IconRotateLeft" class="no-address__header_reset" @click="emit('reset')"
      >Reset search</PhilaButton
    >
  </div>
</template>

<style scoped>
.no-address {
  width: 100%;
  height: fit-content;
  display: grid;
  grid-template-rows:
    [icon-row-start]
    auto
    [icon-row-end]
    var(--spacing-m, 1rem)
    [heading-row]
    auto
    [subhead-row-start]
    auto
    [subhead-row-end]
    var(--spacing-m, 1rem)
    [continue-start]
    auto
    [continue-end]
    var(--spacing-l, 1.5rem)
    [reset-row-start]
    auto
    [reset-row-end];
  padding: var(--spacing-l, 1.5rem) var(--spacing-m, 1rem);
  place-items: center;
  border-radius: 0 0 1.5rem 1.5rem;
  background: var(--Schemes-Background, #fff);

  /* Elevation/Elevation Light/2 */
  box-shadow: var(--elevation-light-2);
  clip-path: inset(0 -8px -8px -8px);
}

.no-address__header_icon {
  color: var(--Schemes-On-Surface-Low, #636363);
  grid-row: icon-row-start;
}

.no-address__header_text {
  grid-row: heading-row;
}

.no-address__header_subtext {
  grid-row: subhead-row-start;
}

.no-address__header_continue {
  grid-row: continue-start;
}

.no-address__header_reset {
  grid-row: reset-row-start;
}
</style>
