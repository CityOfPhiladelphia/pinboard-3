<script setup lang="ts">
import { Pinboard } from '@pinboard/ui'
import '@pinboard/ui/style.css'
import { PhilaButton } from '@phila/phila-ui-button'
import { MapMarker, MapIconTextPin } from '@phila/phila-ui-map-core'
import { faGauge } from '@fortawesome/free-solid-svg-icons'
import { useRouter } from 'vue-router'
import LocationList from './components/LocationList.vue'
import LocationDetail from './components/LocationDetail.vue'
import type { LocationDTO, Gauge, Location } from './types'

function allGauges(locations: unknown): Gauge[] {
  const dto = locations as LocationDTO
  return [...dto.awareGauges, ...dto.usgsGauges]
}

function pinLabel(gauge: Gauge): string {
  return gauge.gaugeId.slice(0, 8)
}

function gaugeToLocation(gauge: Gauge, dto: LocationDTO): Location {
  const kind = dto.awareGauges.includes(gauge) ? 'AwareGauge' as const : 'UsgsGauge' as const
  return {
    id: gauge.gaugeId,
    name: gauge.name,
    latitude: gauge.latitude,
    longitude: gauge.longitude,
    lastUpdated: gauge.lastUpdated,
    other: { kind, data: gauge },
  }
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

    <template #location-list="{ locations, onSelect, hoveredId, onHover, onHoverEnd }">
      <LocationList
        :locations="locations"
        :hovered-id="hoveredId"
        @card-click="(loc) => onSelect(loc)"
        @card-hover="(id: string) => onHover(id)"
        @card-hover-end="onHoverEnd"
      />
    </template>

    <template #location-detail="{ location, onClose }">
      <LocationDetail
        :location="location"
        :on-close="onClose"
      />
    </template>

    <template #map-content="{ locations, hoveredId, selectedId, onHover, onHoverEnd, onSelect }">
      <MapMarker
        v-for="gauge in allGauges(locations)"
        :key="gauge.gaugeId"
        :lng-lat="[gauge.longitude, gauge.latitude]"
        :z-index="hoveredId === gauge.gaugeId || selectedId === gauge.gaugeId ? 10 : undefined"
      >
        <MapIconTextPin
          :icon="faGauge"
          :text="pinLabel(gauge)"
          color-theme="dark-primary"
          :hovered="hoveredId === gauge.gaugeId"
          :selected="selectedId === gauge.gaugeId"
          @mouseenter="onHover(gauge.gaugeId)"
          @mouseleave="onHoverEnd()"
          @click="onSelect(gaugeToLocation(gauge, locations))"
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
