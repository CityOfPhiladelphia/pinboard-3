import { type Ref, ref, toValue, watchEffect } from 'vue'
import type { LatLon } from '../types'

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

    const url = `${import.meta.env.DEV ? import.meta.env.VITE_AIS_URL : 'https://0spy4bb9w1.execute-api.us-east-1.amazonaws.com/queryAisAddress?address='}${encodeURIComponent(addressDeref)}`

    try {
      const result: LatLon = await (await fetch(url)).json()
      addressCoordinates.value.longitude = result.longitude ?? NaN
      addressCoordinates.value.latitude = result.latitude ?? NaN
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
