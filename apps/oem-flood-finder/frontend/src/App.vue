<script setup lang="ts">
import { Pinboard } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { MapMarker, MapIconTextPin } from '@phila/phila-ui-map-core/components'
import { useRouter } from 'vue-router'
import LocationList from './components/LocationList.vue'
import LocationDetail from './components/LocationDetail.vue'
import type { LocationDTO, Gauge } from './types'

function allGauges(locations: unknown): Gauge[] {
  const dto = locations as LocationDTO
  return [...dto.awareGauges, ...dto.usgsGauges]
}

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

    <template #location-list="{ locations, onSelect }">
      <LocationList
        :locations="locations"
        @card-click="(loc) => onSelect(loc)"
      />
    </template>

    <template #location-detail="{ location, onClose }">
      <LocationDetail
        :location="location"
        :on-close="onClose"
      />
    </template>

    <template #map-content="{ locations }">
      <MapMarker
        v-for="gauge in allGauges(locations)"
        :key="gauge.gaugeId"
        :lng-lat="[gauge.longitude, gauge.latitude]"
      >
        <MapIconTextPin
          icon="fa-solid fa-gauge-circle-bolt"
          :text="gauge.name"
          color-theme="dark-primary"
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
