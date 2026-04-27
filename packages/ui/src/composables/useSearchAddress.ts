import { type Ref, ref, toValue, watchEffect } from 'vue'
import type { AisAddressSearchResponse, LatLon } from '../types'

export function useSearchAddress(address: string | Ref<string>) {
  const addressCoordinates = ref<LatLon>({
    latitude: NaN,
    longitude: NaN,
  })

  function clearAddress() {
    addressCoordinates.value.longitude = NaN
    addressCoordinates.value.latitude = NaN
  }

  async function getAddressCoordinatesFromAIS() {
    const addressDeref = toValue(address)
    if (!addressDeref) {
      clearAddress()
      return
    }

    const url = `https://api.phila.gov/ais/v1/search/${encodeURIComponent(addressDeref)}?gatekeeperKey=${import.meta.env.VITE_OEM_FLOOD_GATEKEEPER_KEY}`

    try {
      const result: AisAddressSearchResponse = await (await fetch(url)).json()
      addressCoordinates.value.longitude =
        result.features[0].geometry.coordinates[0]
      addressCoordinates.value.latitude =
        result.features[0].geometry.coordinates[1]
    } catch (err) {
      console.error('Failed to get response from AIS: ', err)
      clearAddress()
    }
  }

  watchEffect(() => {
    getAddressCoordinatesFromAIS()
  })

  return { addressCoordinates }
}
