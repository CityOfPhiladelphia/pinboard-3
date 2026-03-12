<script setup lang="ts">
import { ref } from 'vue'
import { BaseCard, CardContent } from '@phila/phila-ui-cards'
import type { LocationDTO, Location } from '../types'

const props = defineProps<{
  locations: LocationDTO
}>()

const emit = defineEmits<{
  'card-click': [device: Location]
}>()

const pendingKeydown = ref(false)

const locations = ref(props.locations);

function onCardKeyup(device: Location) {
  if (pendingKeydown.value) {
    emit('card-click', device)
    pendingKeydown.value = false
  }
}

function transformLocationDTO(locationDto: LocationDTO) : Location[]  {
  let locations: Location[] = [];

  for(let gauge of locationDto.awareGauges){
    locations.push({
      id: gauge.gaugeId,
      name: gauge.name,
      latitude: gauge.latitude,
      longitude: gauge.longitude,
      lastUpdated: gauge.lastUpdated,
      other: {
        kind: 'Aware',
        data: gauge
      }
    })
  }

  for(let gauge of locationDto.usgsGauges){
    locations.push({
      id: gauge.gaugeId,
      name: gauge.name,
      latitude: gauge.latitude,
      longitude: gauge.longitude,
      lastUpdated: gauge.lastUpdated,
      other: {
        kind: 'Usgs',
        data: gauge
      }
    })
  }

  for(let camera of locationDto.cameras){
    locations.push({
      id: camera.cameraId,
      name: camera.name,
      latitude: camera.latitude,
      longitude: camera.longitude,
      lastUpdated: camera.lastUpdated,
      other: {
        kind: 'Camera',
        data: camera
      }
    })
  }
  
  return locations;
}

</script>

<template>
  <div class="location-list">

  <BaseCard
    v-for="device in transformLocationDTO(locations)"
    :key="device.id"
    layout="vertical"
    class="location-card"
    tabindex="0"
    @click="emit('card-click', device)"
    @keydown.enter="pendingKeydown = true"
    @keyup.enter="onCardKeyup(device)"
  >
    <CardContent>{{ device.name }}</CardContent>
  </BaseCard>

  </div>
</template>

<style scoped>
.location-list {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.location-card {
  cursor: pointer;
}
</style>
