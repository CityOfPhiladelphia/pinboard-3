import { type Ref, ref, toValue, watchEffect } from 'vue'
import type { AisAddressSearchResponse, LatLon } from '../types'

export function useSearchAddress(address: string | Ref<string>) {
  const addressCoordinates = ref<LatLon>({
    latitude: NaN,
    longitude: NaN,
  })
  const finishedAddressFetch = ref<boolean>(false)

  function clearAddress() {
    addressCoordinates.value.longitude = NaN
    addressCoordinates.value.latitude = NaN
  }

  async function getAddressCoordinatesFromAIS() {
    finishedAddressFetch.value = false
    const addressDeref = toValue(address)
    if (!addressDeref) {
      clearAddress()
      finishedAddressFetch.value = true
      return
    }

    const url = `https://api.phila.gov/ais/v1/search/${encodeURIComponent(addressDeref)}`

    try {
      const result: AisAddressSearchResponse = await (await fetch(url)).json()
      addressCoordinates.value.longitude =
        result.features[0].geometry.coordinates[0]
      addressCoordinates.value.latitude =
        result.features[0].geometry.coordinates[1]
      finishedAddressFetch.value = true
    } catch (err) {
      console.error('Failed to get response from AIS: ', err)
      clearAddress()
      finishedAddressFetch.value = true
    }
  }

  watchEffect(() => {
    getAddressCoordinatesFromAIS()
  })

  return { addressCoordinates, finishedAddressFetch }
}
