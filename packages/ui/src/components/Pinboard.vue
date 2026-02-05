<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="pinboard">
    <header class="pinboard-header">
      <h1>{{ title }}</h1>
    </header>

    <main class="pinboard-main">
      <div class="pinboard-locations-panel">
        <slot name="locations">
          <p>Locations Panel</p>
        </slot>
      </div>

      <div class="pinboard-map-panel">
        <slot name="map">
          <p>Map Panel</p>
        </slot>
      </div>
    </main>

    <footer class="pinboard-footer">
      <slot name="footer">
        <p>City of Philadelphia</p>
      </slot>
    </footer>
  </div>
</template>

<style scoped>
.pinboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.pinboard-header {
  padding: 1rem;
  background: #0f4d90;
  color: white;
}

.pinboard-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.pinboard-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.pinboard-locations-panel {
  width: 50%;
  overflow-y: auto;
  padding: 1rem;
  border-right: 1px solid #ccc;
}

.pinboard-map-panel {
  width: 50%;
  overflow: hidden;
}

.pinboard-footer {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border-top: 1px solid #ccc;
}

.pinboard-footer p {
  margin: 0;
  font-size: 0.875rem;
}
</style>
