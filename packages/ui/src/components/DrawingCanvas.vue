<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

const props = withDefaults(
  defineProps<{
    height: number
    width: number
    lineWidth?: number
    lineCap?: 'butt' | 'round' | 'square'
    strokeStyle?: CanvasGradient | CanvasPattern | string
  }>(),
  {
    lineWidth: 5,
    lineCap: 'butt',
    strokeStyle: 'red',
  }
)

const canvas = useTemplateRef('canvasRef')
const context = ref<CanvasRenderingContext2D | undefined>(undefined)
let pointerLoc = { x: 0, y: 0 }
let isDrawing = false

onMounted(() => {
  if (!canvas.value) {
    throw new Error(`Failed to locate canvas element`)
  }
  canvas.value.addEventListener('mousedown', startDrawing)
  canvas.value.addEventListener('mouseup', stopDrawing)
  canvas.value.addEventListener('mousemove', sketch)

  context.value = canvas.value.getContext('2d') ?? undefined
  if (!context.value) {
    throw new Error('Failed to locate get context from canvas element')
  }
  context.value.lineWidth = props.lineWidth
  context.value.lineCap = props.lineCap
  context.value.strokeStyle = props.strokeStyle
  context.value.lineJoin = 'round'
})

onBeforeUnmount(() => {
  canvas.value?.removeEventListener('mousedown', startDrawing)
  canvas.value?.removeEventListener('mouseup', stopDrawing)
  canvas.value?.removeEventListener('mousemove', sketch)
})

function getPosition(event: MouseEvent) {
  if (!canvas.value) {
    throw new Error(`getPosition failed on canvas element`)
  }
  const rect = canvas.value.getBoundingClientRect()
  pointerLoc = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function startDrawing(event: MouseEvent) {
  if (!context.value) return
  isDrawing = true
  getPosition(event)
  context.value.beginPath()
  context.value.moveTo(pointerLoc.x, pointerLoc.y)
}

function stopDrawing() {
  if (!isDrawing || !context.value) return
  isDrawing = false
  context.value.lineTo(pointerLoc.x, pointerLoc.y)
  context.value.closePath()
  context.value.stroke()
}

function sketch(event: MouseEvent) {
  if (!isDrawing || !context.value) return
  getPosition(event)
  context.value.lineTo(pointerLoc.x, pointerLoc.y)
  context.value.stroke()
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
  background-color: aqua;
}
</style>
