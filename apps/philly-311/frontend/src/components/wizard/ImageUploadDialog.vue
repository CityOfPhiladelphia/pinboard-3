<!-- ABOUTME: Wizard exit confirmation dialog — offers saving the in-progress
     report as a draft or discarding it; cancelling keeps the user in the wizard. -->
<script setup lang="ts">
import { ref, watch, onMounted, useTemplateRef } from 'vue'

import { PhilaButton, CloseButton } from '@phila/phila-ui-button'
import { Tags } from '@phila/phila-ui-tags'
import { Icon } from '@phila/phila-ui-core'
import { IconPencil, IconBackwardStep, IconForwardStep } from '@phila/phila-ui-core/icons'
import { DrawingCanvas } from '@pinboard/ui'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [value: boolean]; save: []; discard: [] }>()

const title = 'Show us where the issue appears in your photo'
const note = `Draw a circle around where the issue appears, or skip ahead to the next step.`

const dialog = ref<HTMLDialogElement | null>(null)
const canvasRef = useTemplateRef('canvasRef')
const drawingComplete = ref<boolean>(false)
const canvasHeight = ref(0)
const canvasWidth = ref(0)

// The template ref isn't populated until after the first render, so an
// `immediate` watch would run before `dialog.value` exists — sync once on
// mount to cover being instantiated already-open, then watch for changes.
onMounted(() => syncOpen(props.open))

watch(() => props.open, syncOpen)

function syncOpen(open: boolean) {
  if (open) {
    dialog.value?.showModal()
    canvasHeight.value = canvasRef.value?.clientHeight ?? 0
    canvasWidth.value = canvasRef.value?.clientWidth ?? 0
  } else dialog.value?.close()
}

function close() {
  emit('update:open', false)
}
function onSave() {
  close()
  emit('save')
}
function onDiscard() {
  close()
  emit('discard')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="image-dialog"
    aria-labelledby="image-dialog-title"
    @close="close"
    @cancel="close"
  >
    <div class="image-dialog-close">
      <CloseButton aria-label="Close image upload dialog" @click="close" />
    </div>

    <div id="image-dialog-title" class="image-dialog-title" v-text="title" />
    <div />
    <div class="image-dialog-callout">
      <Icon :icon="IconPencil" size="extra-small" /> {{ note }}
    </div>
    <div />
    <div ref="canvasRef" class="image-dialog-canvas">
      <DrawingCanvas
        v-if="canvasHeight && canvasWidth"
        :height="canvasHeight"
        :width="canvasWidth"
      ></DrawingCanvas>
    </div>

    <div />
    <div class="image-dialog-actions">
      <Tags text="Redo" :icon="IconForwardStep" color="white" @click="onSave" />
      <Tags text="Undo" :icon="IconBackwardStep" color="white" @click="onDiscard" />
    </div>
    <div />
    <div class="image-dialog-footer">
      <PhilaButton variant="secondary" data-test="image-discard" @click="close">Cancel</PhilaButton>
      <PhilaButton
        :variant="drawingComplete ? 'primary' : 'secondary'"
        data-test="image-save"
        @click="close"
        >{{ drawingComplete ? 'Next' : 'Skip' }}</PhilaButton
      >
    </div>
  </dialog>
</template>

<style scoped>
.image-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: grid;
  grid-template-areas:
    'close'
    'title'
    'title-space'
    'callout'
    'callout-space'
    'canvas'
    'canvas-space'
    'actions'
    'actions-space'
    'footer';
  grid-template-rows:
    auto auto var(--spacing-l, 1.5rem) auto var(--spacing-m, 1rem) 1fr var(--spacing-s, 0.75rem)
    auto var(--spacing-3xl, 3rem) auto;
  width: clamp(10vw, 50rem, 90vw);
  height: clamp(10vh, 45rem, 90vh);
  padding: var(--spacing-xl, 2rem);
  border-radius: var(--border-radius-xl, 1.5rem);
  background: var(--Schemes-Background, #fff);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
}

dialog:not([open]) {
  display: none;
}

.image-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

.image-dialog-close {
  margin-left: auto;
}

.image-dialog-close > .phila-button {
  color: var(--Schemes-On-Surface-High, #000) !important;
}

.image-dialog-title {
  grid-area: title;
  color: var(--Schemes-On-Surface-High, #000);

  /* Subtitle/Subtitle 1 */
  font-family: var(--Subtitle-font-subtitle-family, Montserrat);
  font-size: var(--Subtitle-Subtitle-1-font-subtitle-1-size, 1.5rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Subtitle-Subtitle-1-font-subtitle-1-lineheight, 2.25rem); /* 150% */
}

.image-dialog-callout {
  grid-area: callout;
  display: grid;
  grid-template-columns: auto auto;
  place-items: center;
  padding: var(--spacing-m, 1rem);
  gap: var(--spacing-xs, 0.5rem);
  border-radius: var(--border-radius-m, 0.75rem);
  background: var(--Schemes-Info-Container, #dbefff);
  color: var(--Schemes-On-Secondary-Container, #000);
  /* Label/Default */
  font-family: var(--Label-Default-font-label-default-family, Montserrat);
  font-size: var(--Label-Default-font-label-default-size, 1rem);
  font-style: normal;
  font-weight: 600;
  line-height: var(--Label-Default-font-label-default-lineheight, 1.5rem); /* 150% */
}

.image-dialog-canvas {
  grid-area: canvas;
  height: 100%;
  width: 100%;
}

.image-dialog-actions {
  grid-area: actions;
  display: flex;
  margin-left: auto;
  gap: var(--spacing-xs, 0.5rem);
}

.image-dialog-footer {
  grid-area: footer;
  display: flex;
  margin-left: auto;
  gap: var(--spacing-xs, 0.5rem);
}
</style>
