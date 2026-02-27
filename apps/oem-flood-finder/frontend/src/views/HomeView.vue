<script setup lang="ts">
import { PhilaButton } from '@phila/phila-ui-button'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="home-view content">
    <section class="hero">
      <h1>Eastwick Flood Mapping</h1>
      <p class="hero-subtitle">
        Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae
        pellentesque sem placerat. JKHSAKFKJSAHFJKASHFJKHASKFHASJKFHKJSADHFKJSDHFJKSHDFJKHSDJKFHSJKDFHSKJDF
      </p>
      <div class="hero-actions">
        <PhilaButton text="View gauges" @click="router.push('/finder')" />
        <PhilaButton text="View cameras" @click="router.push('/finder')" />
      </div>
    </section>

    <section class="body-content">
      <h2>Heading</h2>
      <p>
        Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae
        pellentesque sem placerat.
      </p>
      <p>
        In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor.
        Pulvinar vivamus fringilla lacus nec metus bibendum egestas.
      </p>
      <p>
        Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae
        pellentesque sem placerat.
      </p>
      <p>
        Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae
        pellentesque sem placerat.
      </p>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.hero {
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 2rem;
  background-color: var(--Schemes-Surface);
}

.hero-subtitle {
  max-width: 40rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
}

.body-content {
  max-width: 50rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
