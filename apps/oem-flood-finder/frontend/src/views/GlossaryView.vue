<script setup lang="ts">
import type { LocationListDTO, OemLocation } from '@/types'
import { computed, onMounted, ref } from 'vue'

/**
 * @returns distance in miles
 */
function getHaversineDistance(
  deviceLat: number,
  deviceLong: number,
  userLat: number,
  userLong: number,
): number {
  const R = 6371 // Earth's mean radius in kilometers

  const dLat = (userLat - deviceLat) * (Math.PI / 180)
  const dLon = (userLong - deviceLong) * (Math.PI / 180)

  const lat1 = deviceLat * (Math.PI / 180)
  const lat2 = userLat * (Math.PI / 180)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c * 0.621371 // convert to miles
}

let locationListDTO = ref<LocationListDTO | null>(null)
let currentLocation = ref<{ lat: number; long: number } | null>(null)
let isLoading = ref<boolean>(true)
let error = ref<string | null>(null)
let oemLocations = ref<OemLocation[]>([])

let distance = computed(() => {
  if (locationListDTO.value === null) {
    return null
  }

  if (currentLocation.value === null) {
    return null
  }

  return getHaversineDistance(
    locationListDTO.value.latitude,
    locationListDTO.value.longitude,
    currentLocation.value.lat,
    currentLocation.value.long,
  )
})

if (navigator.geolocation) {
  navigator.geolocation.watchPosition((pos) => {
    currentLocation.value = {
      lat: pos.coords.latitude,
      long: pos.coords.longitude,
    }
  })
}

// /**
//  * http://open-notify.org/Open-Notify-API/ISS-Location-Now/
//  */
// type IssData = {
//   timestamp: number
//   iss_position: {
//     latitude: number
//     longitude: number
//   }
// }

onMounted(async () => {
  let result = await fetch('http://api.open-notify.org/iss-now.json')

  if (result.ok) {
    locationListDTO.value = await result.json()
  } else {
    error.value = result.statusText
  }

  isLoading.value = false
})
</script>

<template>
  <div>
    <template v-if="isLoading">
      <progress></progress>
    </template>

    <template v-else-if="error !== null">
      {{ error }}
    </template>

    <template v-else>
      {{ oemLocations }}
    </template>
  </div>

  <div>
    <template v-if="currentLocation === null"> No user location given </template>

    <template v-else>
      {{ currentLocation }}
    </template>
  </div>

  <div>
    <template v-if="distance === null"> Cannot calculate the distance yet </template>

    <template v-else> You are {{ distance }} miles away from the ISS. </template>
  </div>
</template>
