import { ref, toValue, watchEffect, type MaybeRef } from 'vue'
import { hasLocationData } from '../utilities/hasLocationData'
import type { BasicLocation, LatLon, UseUserAndSearchLocationsParams } from '../types'
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
    locationSearchMode,
    getUserLocation,
    endWatch,
    handleMapGeolocate,
    handleMapGeolocateError,
    locationNotDefault,
  } = useUserLocation(userLocationParams)
  const addressForSearch = ref<string>('')
  const { addressCoordinates, finishedAddressFetch } = useSearchAddress(
    addressForSearch,
    aisClientId
  )
  const zipcodeForSearch = ref<string>('')
  const { zipcodePolygon, finishedZipFetch } = useSearchZipcode(zipcodeForSearch)
  const keywordsForSearch = ref<string>('')
  const searchOrUserLocation = ref<LatLon>(userLocation.value)

  watchEffect(() => {
    const useAddressSearch =
      locationSearchMode.value === 'address' &&
      finishedAddressFetch.value &&
      locationNotDefault(addressCoordinates)

    const useZipcodeSearch =
      locationSearchMode.value === 'zipcode' &&
      finishedZipFetch.value &&
      locationNotDefault(zipcodePolygon.value.centroid)

    const useUserLocation =
      (!locationSearchMode.value || locationSearchMode.value === 'keyword') &&
      finishedAddressFetch.value &&
      finishedZipFetch.value &&
      locationNotDefault(userLocation)

    switch (true) {
      case useAddressSearch: {
        searchOrUserLocation.value = addressCoordinates.value
        break
      }
      case useZipcodeSearch: {
        searchOrUserLocation.value = zipcodePolygon.value.centroid
        break
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
    locationNotDefault,
  }
}
