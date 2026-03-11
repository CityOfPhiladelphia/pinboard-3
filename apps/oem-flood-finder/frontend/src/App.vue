<script setup lang="ts">
import { Pinboard } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { MapMarker, MapIconTextPin } from '@phila/phila-ui-map-core'
import { faGauge } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'vue-router'
import LocationDetail from './components/LocationDetail.vue'

const router = useRouter()
</script>

<template>
  <Pinboard>
    <template #home>
      <section class="hero">
        <p class="hero-subtitle">
          Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae
          pellentesque sem placerat.
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
      </section>
    </template>

    <template #location-card="{ location }">
      {{ location.name }}
    </template>

    <template #location-detail="{ location, onClose }">
      <LocationDetail
        :location="location"
        :on-close="onClose"
      />
    </template>

    <template #map-content="{ locations, hoveredId, selectedId, onHover, onHoverEnd, onSelect }">
      <MapMarker
        v-for="loc in locations"
        :key="loc.id"
        :lng-lat="[loc.longitude, loc.latitude]"
        :z-index="hoveredId === loc.id || selectedId === loc.id ? 10 : undefined"
      >
        <MapIconTextPin
          :icon="faGauge"
          :text="loc.id.slice(0, 8)"
          color-theme="dark-primary"
          :hovered="hoveredId === loc.id"
          :selected="selectedId === loc.id"
          @mouseenter="onHover(loc.id)"
          @mouseleave="onHoverEnd()"
          @click="onSelect(loc)"
        />
      </MapMarker>
    </template>
  </Pinboard>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
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
