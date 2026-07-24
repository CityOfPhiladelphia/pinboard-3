<!-- ABOUTME: Generic stat card: a large value over a label, tinted by tone.
     Presentational only — the caller decides what the numbers mean. -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    value: number | string
    label: string
    tone?: 'neutral' | 'success' | 'info' | 'danger'
  }>(),
  { tone: 'neutral' },
)
</script>

<template>
  <div class="stat-tile">
    <p class="stat-tile__value" :class="`stat-tile__value--${tone}`">{{ value }}</p>
    <p class="stat-tile__label" :class="`stat-tile__label--${tone}`">{{ label }}</p>
  </div>
</template>

<style scoped>
.stat-tile {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 1rem;
  background: #fff;
  border: 1px solid var(--Schemes-Border-low, #ccc);
  border-radius: 8px;
}
.stat-tile__value {
  margin: 0;
  font-size: 2.5rem;
  line-height: 1.2;
  font-weight: 700;
}
.stat-tile__label {
  margin: 0;
  font-size: 1rem;
  line-height: 1.25rem;
  font-weight: 600;
}
.stat-tile__value--neutral,
.stat-tile__label--neutral {
  color: #000;
}
.stat-tile__value--success,
.stat-tile__label--success {
  color: var(--Schemes-Success, #1bb82a);
}
.stat-tile__value--info,
.stat-tile__label--info {
  color: var(--colors-Purple, #6300de);
}
.stat-tile__value--danger,
.stat-tile__label--danger {
  color: var(--Schemes-Error, #cc3000);
}
</style>
