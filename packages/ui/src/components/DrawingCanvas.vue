<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

const props = defineProps<{
  height: number
  width: number
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
  drawingCanvas.value.addEventListener('mousedown', startDrawing)
  drawingCanvas.value.addEventListener('mouseup', stopDrawing)
  drawingCanvas.value.addEventListener('mousemove', drawLine)

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
  drawingCanvas.value?.removeEventListener('mousedown', startDrawing)
  drawingCanvas.value?.removeEventListener('mouseup', stopDrawing)
  drawingCanvas.value?.removeEventListener('mousemove', drawLine)
})

function getPosition(event: MouseEvent) {
  if (!drawingCanvas.value) {
    throw new Error(`getPosition failed on canvas element`)
  }
  const rect = drawingCanvas.value.getBoundingClientRect()
  pointerLoc = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function startDrawing(event: MouseEvent) {
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

function drawLine(event: MouseEvent) {
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
    :height="height"
    :width="width"
    class="drawing-canvas"
    @mouseleave="stopDrawing"
  ></canvas>
</template>

<style scoped>
.drawing-canvas {
  cursor:
    url('../assets/pencil.svg') 0 30,
    crosshair;
}
</style>
