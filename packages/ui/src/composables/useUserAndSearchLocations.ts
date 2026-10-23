import { ref, toValue, watchEffect, type MaybeRef } from 'vue'
import { hasLocationData } from '../utilities/hasLocationData'
import type { BasicLocation, LatLon, SearchMode, UseUserAndSearchLocationsParams } from '../types'
import { useSearchAddress, useSearchZipcode, useUserLocation } from './_index'
import {
  getHaversineDistance,
  StreetAddress,
  StreetIntersection,
  Zipcode,
} from '../utilities/_index'

export function useUserAndSearchLocations(options: UseUserAndSearchLocationsParams = {}) {
  const { aisClientId, ...userLocationParams } = options
  const {
    userLocation,
    userLocationState,
    getUserLocation,
    endWatch,
    handleMapGeolocate,
    handleMapGeolocateError,
  } = useUserLocation(userLocationParams)
  const addressForSearch = ref<string>('')
  const { addressCoordinates, finishedAddressFetch } = useSearchAddress(
    addressForSearch,
    aisClientId
  )
  const zipcodeForSearch = ref<string>('')
  const { zipcodePolygon, finishedZipFetch } = useSearchZipcode(zipcodeForSearch)
  const keywordsForSearch = ref<string>('')
  const locationSearchMode = ref<SearchMode>(undefined)
  const searchOrUserLocation = ref<LatLon>(userLocation.value)

  watchEffect(() => {
    const useAddressSearch =
      locationSearchMode.value === 'address' &&
      finishedAddressFetch.value &&
      hasLocationData(addressCoordinates)

    const useZipcodeSearch =
      locationSearchMode.value === 'zipcode' &&
      finishedZipFetch.value &&
      hasLocationData(zipcodePolygon.value.centroid)

    const useUserLocation =
      (!locationSearchMode.value || locationSearchMode.value === 'keyword') &&
      finishedAddressFetch.value &&
      finishedZipFetch.value &&
      hasLocationData(userLocation)

    switch (true) {
      case useAddressSearch: {
        searchOrUserLocation.value = addressCoordinates.value
        return
      }
      case useZipcodeSearch: {
        searchOrUserLocation.value = zipcodePolygon.value.centroid
        return
      }
      case useUserLocation: {
        searchOrUserLocation.value = userLocation.value
        break
      }
      default: {
        searchOrUserLocation.value = options?.defaultLocation ?? {
          latitude: NaN,
          longitude: NaN,
        }
      }
    }
  })

  watchEffect(() => {
    // additional watchEffect because app's geolocate button on map can set the userLocation in a way the other watchEffect cannot see
    if (finishedAddressFetch.value && finishedZipFetch.value && hasLocationData(userLocation.value))
      searchOrUserLocation.value = userLocation.value
  })

  function getLocationsWithDistance<PinboardLocation extends BasicLocation>(
    locations: MaybeRef<PinboardLocation[]>,
    precision: number = 1
  ) {
    const locsWithDistance = toValue(locations)
    if (hasLocationData(searchOrUserLocation)) {
      locsWithDistance.forEach((location) => {
        const dist = getHaversineDistance(
          { latitude: location.latitude, longitude: location.longitude },
          searchOrUserLocation,
          precision
        )
        location.distance = `${dist} mi`
      })
    }
    return locsWithDistance
  }

  function handleSearchSubmit(locationSearchString: string) {
    switch (true) {
      case StreetAddress.test(locationSearchString):
      case StreetIntersection.test(locationSearchString): {
        locationSearchMode.value = 'address'
        addressForSearch.value = locationSearchString
        zipcodeForSearch.value = keywordsForSearch.value = ''
        break
      }
      case Zipcode.test(locationSearchString): {
        locationSearchMode.value = 'zipcode'
        zipcodeForSearch.value = locationSearchString
        addressForSearch.value = keywordsForSearch.value = ''
        break
      }
      case locationSearchString !== '': {
        locationSearchMode.value = 'keyword'
        keywordsForSearch.value = locationSearchString
        addressForSearch.value = zipcodeForSearch.value = ''
        break
      }
      default: {
        locationSearchMode.value = undefined
        addressForSearch.value =
          zipcodeForSearch.value =
          keywordsForSearch.value =
            locationSearchString
      }
    }
  }

  return {
    userLocation,
    userLocationState,
    addressForSearch,
    addressCoordinates,
    finishedAddressFetch,
    zipcodeForSearch,
    zipcodePolygon,
    finishedZipFetch,
    keywordsForSearch,
    locationSearchMode,
    searchOrUserLocation,
    handleSearchSubmit,
    endWatch,
    handleMapGeolocate,
    handleMapGeolocateError,
    getLocationsWithDistance,
    getUserLocation,
  }
}
