<!-- ABOUTME: Wraps a dialog as a centered Modal on desktop and a BottomSheet on
     mobile — the pattern built for VisibilityContactModal, extracted so other
     311 modals can reuse it. Owns the id/group visibility registry, the
     dialog semantics BottomSheet doesn't provide on its own (focus trap,
     aria-modal, escape-to-close, body scroll lock), and open()/close() as a
     single API regardless of which chrome is rendered underneath.

     Only forwards the props/slots VisibilityContactModal actually needs —
     Modal's other slots (custom header/actions/footer content) aren't wired
     through yet since no current consumer needs them. Add them when the
     next modal does. -->
<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { Modal } from '@phila/phila-ui-modal'
import type { ModalEmits } from '@phila/phila-ui-modal'
import { BottomSheet } from '@phila/phila-ui-bottom-sheet'
import { useVisibility, FocusTrap } from '@phila/phila-ui-core'
import { PhilaButton, CloseButton } from '@phila/phila-ui-button'
import type { ButtonProps } from '@phila/phila-ui-button'
import { IS_MOBILE_KEY } from '@pinboard/ui'

const props = withDefaults(
  defineProps<{
    id: string
    group?: string
    title?: string
    dismissible?: boolean
    cancellable?: boolean
    actionLabel?: string
    cancelLabel?: string
    actionButtonProps?: ButtonProps
    cancelButtonProps?: ButtonProps
    submitting?: boolean
    cancelling?: boolean
    /** Bottom-sheet height, as a single-value snapPoints array (no drag). */
    snapPoints?: number[]
  }>(),
  {
    group: 'modals',
    dismissible: false,
    cancellable: false,
    snapPoints: () => [90],
  },
)

const emit = defineEmits<ModalEmits>()

const isMobile = inject(IS_MOBILE_KEY, ref(true))
// Set explicitly (not left to Modal.vue's own defaults) so this registry
// entry doesn't depend on mount history across a desktop/mobile resize.
// outsideClickHide is false since the scrim's own tap-to-close covers that.
const { isVisible, setVisibility, setState } = useVisibility({
  id: props.id,
  group: props.group,
  escapeKeyHide: true,
  outsideClickHide: false,
})
const open = computed(() => isVisible(props.id))
const titleId = `responsive-modal-title-${props.id}`
const contentId = `responsive-modal-content-${props.id}`

function show() {
  // Deferred so the click that opened this doesn't immediately bubble into
  // outsideClickHide's own document listener and close it right back.
  setTimeout(() => setVisibility(true), 0)
}

function hide() {
  setState(props.id, false)
}

// Covers every close path (Cancel/Apply, Escape, scrim tap) via the shared
// registry entry, and replicates Modal.vue's own scroll-lock, since Modal.vue
// itself isn't mounted on mobile to do it there.
watch(
  open,
  (isOpen) => {
    document.body.classList.toggle('is-overflow-hidden', isOpen)
    if (!isOpen) emit('close')
  },
  { immediate: true },
)

defineExpose({ open: show, close: hide })
</script>

<template>
  <Modal
    v-if="!isMobile"
    :id="id"
    :group="group"
    :title="title"
    :dissmissible="dismissible"
    :cancellable="cancellable"
    :action-label="actionLabel"
    :cancel-label="cancelLabel"
    :action-button-props="actionButtonProps"
    :cancel-button-props="cancelButtonProps"
    :submitting="submitting"
    :cancelling="cancelling"
    @submit="emit('submit')"
    @cancel="emit('cancel')"
  >
    <slot />
  </Modal>

  <Teleport v-else-if="open" to="body">
    <FocusTrap :initial-focus-element="title ? `#${titleId}` : `#${contentId}`">
      <BottomSheet
        :id="id"
        :model-value="open"
        scrim
        class="content responsive-modal-sheet"
        :style="{ '--sheet-min-height': `${snapPoints[0]}%` }"
        :snap-points="snapPoints"
        :show-handle="false"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
        @update:model-value="(v: boolean) => !v && hide()"
      >
        <template v-if="dismissible || title" #header>
          <div class="responsive-modal-sheet-header">
            <h2 v-if="title" :id="titleId" class="responsive-modal-sheet-title">{{ title }}</h2>
            <CloseButton
              v-if="dismissible"
              size="medium"
              aria-label="Close"
              class="responsive-modal-sheet-close"
              @click="hide"
            />
          </div>
        </template>
        <div :id="contentId" class="responsive-modal-sheet-content">
          <slot />
        </div>
        <template #footer>
          <div class="responsive-modal-sheet-actions">
            <PhilaButton
              v-if="cancellable"
              :disabled="cancelling || submitting"
              variant="secondary"
              v-bind="cancelButtonProps"
              @click="emit('cancel')"
            >
              <template v-if="cancelling">
                <span>Loading...</span>
              </template>
              <template v-else>{{ cancelLabel || 'Cancel' }}</template>
            </PhilaButton>
            <PhilaButton
              :disabled="submitting || cancelling"
              v-bind="actionButtonProps"
              @click.prevent="emit('submit')"
            >
              <template v-if="submitting">
                <span>Loading...</span>
              </template>
              <template v-else>{{ actionLabel || 'Submit' }}</template>
            </PhilaButton>
          </div>
        </template>
      </BottomSheet>
    </FocusTrap>
  </Teleport>
</template>

<style scoped>
/* BottomSheet's own root is position: absolute; inset: 0, which only gets a
 * definite height from a positioned ancestor — teleported straight to
 * <body> with none, that was collapsing to content height instead of the
 * viewport. fixed sidesteps that, same as Modal.vue's own .overlay. */
.responsive-modal-sheet {
  position: fixed !important;
}
/* BottomSheet sets a fixed inline height from snapPoints. Overriding it
 * lets the sheet grow past that floor for tall content, capped at the full
 * viewport (still scrolls internally beyond that, same as always). */
.responsive-modal-sheet :deep(.bottom-sheet) {
  height: auto !important;
  min-height: var(--sheet-min-height, 90%);
  max-height: 100%;
}
/* show-handle="false" hides the grabber but not its reserved padding. */
.responsive-modal-sheet :deep(.bottom-sheet-grabber-area) {
  padding: 0;
}
/* Only the header's divider — .bottom-sheet-footer has its own. */
.responsive-modal-sheet :deep(.bottom-sheet-header .bottom-sheet-divider) {
  display: none;
}
.responsive-modal-sheet-header {
  /* Title placed in the fixed middle column (not DOM order) centers it
   * regardless of whether the close button is present, while still
   * letting it grow into either empty side if it needs the room. */
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--spacing-m, 1rem);
  width: 100%; /* BottomSheet's own header wrapper is align-items: center */
  padding: 0 var(--spacing-xl, 2rem);
}
.responsive-modal-sheet-title {
  grid-column: 2;
  margin: 0;
  text-align: center;
  font-size: var(--Subtitle-Subtitle-1-font-subtitle-1-size, 1.5rem);
  line-height: var(--Subtitle-Subtitle-1-font-subtitle-1-lineheight, 2.25rem);
}
.responsive-modal-sheet-close {
  grid-column: 3;
  justify-self: end;
}
.responsive-modal-sheet-content {
  padding: var(--spacing-xl, 2rem);
}
.responsive-modal-sheet-actions {
  display: flex;
  gap: var(--spacing-m, 1rem);
  padding: var(--spacing-l, 1.5rem) var(--spacing-xl, 2rem)
    calc(var(--spacing-xl, 2rem) + env(safe-area-inset-bottom));

  button {
    flex: 1 1 0;
  }
}
</style>
