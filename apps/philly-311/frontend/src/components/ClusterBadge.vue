<!-- ABOUTME: Map badge button for a supercluster — shows report count, zooms in on click.
     Size tier class scales with magnitude: <10, <100, or ≥100. -->
<script setup lang="ts">
const props = defineProps<{ count: number; maxCount: number }>()
const t = props.count / props.maxCount

const minSize = 2
const maxSize = 3.5
const clusterSize = `${scaleVals(t, minSize, maxSize)}em`

const minText = 1.5
const maxText = 2
const textSize = `${scaleVals(t, minText, maxText)}rem`

function scaleVals(t: number, min: number, max: number): string {
  return (min + t * (max - min)).toFixed(2)
}
</script>

<template>
  <button
    type="button"
    class="cluster-badge"
    :style="{ width: clusterSize, height: clusterSize, 'font-size': textSize }"
    :aria-label="`${count} reports — zoom in`"
  >
    {{ count }}
  </button>
</template>

<style scoped>
.cluster-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--Schemes-Primary, #0f4d90);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  line-height: 1;
}
</style>
