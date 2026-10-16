<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import type { Dimensions } from '../types'

const props = defineProps<{
  dimensions: Dimensions
  options?: {
    lineWidth?: number
    lineCap?: 'butt' | 'round' | 'square'
    strokeStyle?: CanvasGradient | CanvasPattern | string
  }
}>()

const drawingCanvas = useTemplateRef('canvasRef')
const context = ref<CanvasRenderingContext2D | undefined>(undefined)
const drawingComplete = ref(false)

defineExpose({
  undoLine,
  redoLine,
  drawingCanvas,
  drawingComplete,
})

let pointerLoc = { x: 0, y: 0 }
let isDrawing = false

onMounted(() => {
  if (!drawingCanvas.value) {
    throw new Error(`Failed to locate canvas element`)
  }
  // Pointer events cover mouse, touch and pen; mouse-only events never fire
  // for a finger.
  drawingCanvas.value.addEventListener('pointerdown', startDrawing)
  drawingCanvas.value.addEventListener('pointerup', stopDrawing)
  drawingCanvas.value.addEventListener('pointermove', drawLine)

  context.value = drawingCanvas.value.getContext('2d') ?? undefined
  if (!context.value) {
    throw new Error('Failed to locate get context from canvas element')
  }
  context.value.lineWidth = props.options?.lineWidth || 4
  context.value.lineCap = props.options?.lineCap || 'butt'
  context.value.strokeStyle = props.options?.strokeStyle || 'red'
  context.value.lineJoin = 'round'
})

onBeforeUnmount(() => {
  drawingCanvas.value?.removeEventListener('pointerdown', startDrawing)
  drawingCanvas.value?.removeEventListener('pointerup', stopDrawing)
  drawingCanvas.value?.removeEventListener('pointermove', drawLine)
})

function getPosition(event: PointerEvent) {
  if (!drawingCanvas.value) {
    throw new Error(`getPosition failed on canvas element`)
  }
  const rect = drawingCanvas.value.getBoundingClientRect()
  pointerLoc = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function startDrawing(event: PointerEvent) {
  if (drawingComplete.value || !context.value) return
  isDrawing = true
  getPosition(event)
  context.value.beginPath()
  context.value.moveTo(pointerLoc.x, pointerLoc.y)
}

function stopDrawing() {
  if (!isDrawing || !drawingCanvas.value || !context.value) return
  isDrawing = false
  context.value.lineTo(pointerLoc.x, pointerLoc.y)
  context.value.closePath()
  context.value.stroke()
  drawingComplete.value = true
}

function drawLine(event: PointerEvent) {
  if (!isDrawing || !context.value) return
  getPosition(event)
  context.value.lineTo(pointerLoc.x, pointerLoc.y)
  context.value.stroke()
}

function undoLine() {
  if (!drawingCanvas.value || !context.value) return
  context.value.save()
  context.value.clearRect(0, 0, drawingCanvas.value.width, drawingCanvas.value.height)
  drawingComplete.value = false
}

function redoLine() {
  if (!drawingCanvas.value || !context.value) return
  context.value.restore()
  context.value.stroke()
  drawingComplete.value = true
}
</script>

<template>
  <canvas
    ref="canvasRef"
    :height="dimensions.height"
    :width="dimensions.width"
    class="drawing-canvas"
    @pointerleave="stopDrawing"
    @pointercancel="stopDrawing"
  ></canvas>
</template>

<style scoped>
.drawing-canvas {
  /* Without this the browser claims the touch to scroll or pan, and fires
   * pointercancel instead of letting the stroke continue. */
  touch-action: none;
  cursor:
    url('../assets/pencil.svg') 0 30,
    crosshair;
}
</style>
