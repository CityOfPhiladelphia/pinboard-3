import { type Ref, ref, toValue, watchEffect } from 'vue'
import type { LatLon } from '../types'

export function useSearchAddress(address: string | Ref<string>, clientId?: string) {
  const addressCoordinates = ref<LatLon>({
    latitude: NaN,
    longitude: NaN,
  })
  const finishedAddressFetch = ref<boolean>(true)

  function clearAddress() {
    addressCoordinates.value = {
      latitude: NaN,
      longitude: NaN,
    }
  }

  async function getAddressCoordinatesFromAIS() {
    finishedAddressFetch.value = false
    const addressDeref = toValue(address)
    if (!addressDeref) {
      clearAddress()
      finishedAddressFetch.value = true
      return
    }

    try {
      const url = `https://haydr3k097.execute-api.us-east-1.amazonaws.com/queryAis/addresslocation/${encodeURIComponent(addressDeref)}${import.meta.env.DEV ? `?client_id=${clientId}` : ''}`
      const response = await fetch(url)
      if (!response.ok) {
        clearAddress()
        console.error({ status: response.status, message: response.body })
        return
      }
      addressCoordinates.value = await response.json()
    } catch (err) {
      console.error('Failed to get response from AIS: ', err)
      clearAddress()
    } finally {
      finishedAddressFetch.value = true
    }
  }

  watchEffect(() => {
    getAddressCoordinatesFromAIS()
  })

  return { addressCoordinates, finishedAddressFetch }
}
