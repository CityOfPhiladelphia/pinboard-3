import { computed, ref, toValue, watchEffect, type MaybeRef } from 'vue'
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
  const { userLocation, userLocationState, endWatch, handleMapGeolocate, handleMapGeolocateError } =
    useUserLocation(userLocationParams)
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
        searchOrUserLocation.value = {
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
    locations: PinboardLocation[] | MaybeRef<PinboardLocation[]>
  ) {
    const locsWithDistance = toValue(locations)
    const locationsWithDistance = computed(() => {
      if (!hasLocationData(searchOrUserLocation.value)) return locsWithDistance
      locsWithDistance.forEach((location) => {
        location.distance = `${getHaversineDistance(
          { latitude: location.latitude, longitude: location.longitude },
          {
            latitude: searchOrUserLocation.value.latitude,
            longitude: searchOrUserLocation.value.longitude,
          },
          1
        )} mi`
      })
      return locsWithDistance
    })
    return locationsWithDistance
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
  }
}
