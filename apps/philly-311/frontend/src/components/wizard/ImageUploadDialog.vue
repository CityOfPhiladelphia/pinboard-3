<!-- ABOUTME: Wizard exit confirmation dialog — offers saving the in-progress
     report as a draft or discarding it; cancelling keeps the user in the wizard. -->
<script setup lang="ts">
import { ref, onMounted, useTemplateRef } from 'vue'
import { PhilaButton, CloseButton } from '@phila/phila-ui-button'
import { Tags } from '@phila/phila-ui-tags'
import { Icon } from '@phila/phila-ui-core'
import { IconPencil, IconBackwardStep, IconForwardStep } from '@phila/phila-ui-core/icons'
import { DrawingCanvas, PinboardUtilities } from '@pinboard/ui'
import type { PinboardTypes } from '@pinboard/ui'
import { blobToDataURL, JPEG_QUALITY, resizeImageToMax } from '@/utils/photo'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

const store = useReportSubmissionStore()

const open = defineModel<boolean>('open')
const complete = defineModel<boolean>('complete')
const file = defineModel<string>('file', { default: '' })

const title = 'Show us where the issue appears in your photo'
const note = `Draw a circle around where the issue appears, or skip ahead to the next step.`
const inkColor =
  getComputedStyle(document.documentElement)
    .getPropertyValue('--phillies-red-500-phillies-red')
    .trim() || '#CC3000'

const dialog = ref<HTMLDialogElement | null>(null)
const canvasContainerRef = useTemplateRef('canvasContainerRef')
const canvasRef = useTemplateRef('canvasRef')
const canvasDimentions = ref<PinboardTypes.Dimensions>({
  height: NaN,
  width: NaN,
})
const uploadedImage = ref<HTMLImageElement | undefined>(undefined)
const imageDim = ref<PinboardTypes.Dimensions>({
  height: NaN,
  width: NaN,
})

const canvasBackground = {
  'background-image': `url(${file.value})`,
  'background-repeat': 'no-repeat',
  'background-position': 'center center',
  'background-size': 'contain',
}

onMounted(() => {
  dialog.value?.showModal()

  getImageDimensions(file.value).then((imageDimensions) => {
    imageDim.value = resizeImageToMax(imageDimensions)
    const scales = PinboardUtilities.scaleImageAndContainer(imageDimensions, canvasContainerRef)
    canvasDimentions.value = scales.container
    store.setPhotoDimensions(scales.image)
  })
})

function handleClose() {
  open.value = false
}

function handleSkip() {
  const offCanvas = new OffscreenCanvas(imageDim.value.width, imageDim.value.height)
  if (!canvasRef.value?.drawingCanvas) {
    throw new Error('Ref for drawing canvas was undefined')
  }

  const context = offCanvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to get context from OffscreenCanvas')
  }

  if (!uploadedImage.value) {
    throw new Error('Could not locate uploaded image')
  }

  context.drawImage(uploadedImage.value, 0, 0)
  URL.revokeObjectURL(file.value)
  offCanvas
    .convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY })
    .then(async (markupBlob) => {
      file.value = await blobToDataURL(markupBlob)
      complete.value = true
      open.value = false
    })
}

function handleNext() {
  const offCanvas = new OffscreenCanvas(imageDim.value.width, imageDim.value.height)
  if (!canvasRef.value?.drawingCanvas) {
    throw new Error('Ref for drawing canvas was undefined')
  }

  const context = offCanvas.getContext('2d')
  if (!context) {
    throw new Error('Failed to get context from OffscreenCanvas')
  }
  createImageBitmap(canvasRef.value.drawingCanvas, {
    resizeWidth: imageDim.value.width,
    resizeHeight: imageDim.value.height,
    resizeQuality: 'high',
  }).then((markupImage) => {
    if (!uploadedImage.value) {
      throw new Error('Could not locate uploaded image')
    }
    context.drawImage(uploadedImage.value, 0, 0)
    context.drawImage(markupImage, 0, 0)
    URL.revokeObjectURL(file.value)
    offCanvas
      .convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY })
      .then(async (markupBlob) => {
        file.value = await blobToDataURL(markupBlob)
        complete.value = true
        open.value = false
      })
  })
}

function handleUndo() {
  canvasRef.value?.undoLine()
}

function handleRedo() {
  canvasRef.value?.redoLine()
}

function getImageDimensions(dataURL: string): Promise<PinboardTypes.Dimensions> {
  return new Promise((resolve) => {
    uploadedImage.value = new Image()
    uploadedImage.value.onload = () => {
      resolve({
        height: uploadedImage.value?.height ?? NaN,
        width: uploadedImage.value?.width ?? NaN,
      })
    }
    uploadedImage.value.src = dataURL
  })
}
</script>

<template>
  <dialog
    ref="dialog"
    class="image-dialog"
    aria-labelledby="image-dialog-title"
    @close="handleClose"
    @cancel="handleClose"
  >
    <div class="image-dialog-close">
      <CloseButton aria-label="Close image upload dialog" @click="handleClose" />
    </div>

    <div id="image-dialog-title" class="image-dialog-title" v-text="title" />
    <div />
    <div class="image-dialog-callout">
      <Icon :icon="IconPencil" size="extra-small" /> {{ note }}
    </div>
    <div />
    <div ref="canvasContainerRef" class="image-dialog-canvas">
      <DrawingCanvas
        v-if="open && canvasDimentions.height && canvasDimentions.width"
        ref="canvasRef"
        :dimensions="canvasDimentions"
        :options="{ strokeStyle: inkColor }"
        :style="canvasBackground"
      />
    </div>
    <div />
    <div class="image-dialog-actions">
      <Tags text="Redo" :icon="IconForwardStep" color="white" @click="handleRedo" />
      <Tags text="Undo" :icon="IconBackwardStep" color="white" @click="handleUndo" />
    </div>
    <div />
    <div class="image-dialog-footer">
      <PhilaButton variant="secondary" data-test="image-discard" @click="handleClose"
        >Cancel</PhilaButton
      >
      <PhilaButton
        :variant="canvasRef?.drawingComplete ? 'primary' : 'secondary'"
        data-test="image-save"
        @click="canvasRef?.drawingComplete ? handleNext() : handleSkip()"
        >{{ canvasRef?.drawingComplete ? 'Next' : 'Skip' }}</PhilaButton
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
  width: clamp(15rem, 50svh + 20rem, 90svh);
  height: clamp(15rem, 50svh + 20rem, 80svh);
  padding: var(--spacing-xl, 2rem);
  border: none;
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
  color: var(--Schemes-On-Surface-High, #000);
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
  overflow: clip;
  display: grid;
  place-content: center;
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
