<!-- ABOUTME: Map badge button for a supercluster — shows report count, zooms in on click.
     Size tier class scales with magnitude: <10, <100, or ≥100. -->
<script setup lang="ts">
defineProps<{ count: number }>()
</script>

<template>
  <button
    type="button"
    class="cluster-badge"
    :class="
      count < 10 ? 'cluster-badge--sm' : count < 100 ? 'cluster-badge--md' : 'cluster-badge--lg'
    "
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

.cluster-badge--sm {
  width: 32px;
  height: 32px;
  font-size: 0.75rem;
}

.cluster-badge--md {
  width: 42px;
  height: 42px;
  font-size: 0.875rem;
}

.cluster-badge--lg {
  width: 54px;
  height: 54px;
  font-size: 1rem;
}
</style>
