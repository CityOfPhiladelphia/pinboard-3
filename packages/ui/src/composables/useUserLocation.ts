import { type MaybeRef, ref, toValue, watch } from 'vue'
import type {
  LatLon,
  LocationPermissionState,
  SearchMode,
  UserLocationState,
  UseUserLocationParams,
} from '../types'
import { hasLocationData } from '../utilities/hasLocationData'

export function useUserLocation(options?: UseUserLocationParams) {
  const locationSearchMode = ref<SearchMode>(undefined)
  const unknownLocation = {
    latitude: NaN,
    longitude: NaN,
  }
  const defaultLocation = options?.defaultLocation ?? unknownLocation
  const promptOnPageLoad = options?.promptOnPageLoad ?? false
  const watchLocation = options?.watchLocation ?? false
  const geolocationOptions = {
    enableHighAccuracy: options?.enableHighAccuracy ?? false,
    timeout: options?.timeout ?? Infinity,
    maximumAge: options?.maximumAge ?? 0,
  }

  const userLocation = ref<LatLon>(defaultLocation)
  const userLocationPermissionState = ref<LocationPermissionState>('prompt')
  const userLocationState = ref<UserLocationState>('unknown')
  const gotInitialLocation = ref<boolean>(false)
  const watchId = ref<number | null>(null)

  try {
    navigator.permissions
      .query({
        name: 'geolocation',
      })
      .then((useLocationPermission) => {
        // set userLocationPermissionState to change whenever navigator.permissions.state changes
        // Safari has a known bug that keeps this from working (https://bugs.webkit.org/show_bug.cgi?id=259432)
        useLocationPermission.onchange = () => {
          switch (useLocationPermission.state) {
            case 'granted':
            case 'denied': {
              userLocationPermissionState.value = useLocationPermission.state
              break
            }
            case 'prompt': {
              if (gotInitialLocation.value) {
                userLocationPermissionState.value = 'denied'
              } else {
                getUserLocation()
              }
              break
            }
          }
        }
      })
  } catch (error) {
    console.error(error)
    clearUserLocation()
    userLocationPermissionState.value = 'denied'
  }

  watch(gotInitialLocation, (gotLocation) => {
    if (gotLocation && watchLocation) {
      watchId.value = navigator.geolocation.watchPosition(
        locationSuccess,
        locationError,
        geolocationOptions
      )
    }
  })

  watch(
    userLocationPermissionState,
    async (newPermissionState, oldPermissionState) => {
      switch (newPermissionState) {
        case 'granted':
        case 'prompt': {
          if (!gotInitialLocation.value) {
            await getUserLocation()
          }
          break
        }
        case 'denied': {
          if (watchId.value) {
            navigator.geolocation.clearWatch(watchId.value)
          }
          clearUserLocation()
          if (oldPermissionState === 'granted') {
            userLocationPermissionState.value = 'prompt'
          }
          break
        }
      }
    },
    { immediate: promptOnPageLoad }
  )

  function getUserLocation(): Promise<void> {
    userLocationState.value = 'acquiring'
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        resolve(locationError(new GeolocationPositionError()))
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(locationSuccess(pos)),
        (error) => resolve(locationError(error)),
        geolocationOptions
      )
    })
  }

  function locationSuccess(position: GeolocationPosition) {
    // only show location on map if user is in or near Philly
    const newLocation: LatLon = {
      latitude: checkLatitudeInRange(position.coords.latitude) ? position.coords.latitude : NaN,
      longitude: checkLongitudeInRange(position.coords.longitude) ? position.coords.longitude : NaN,
      accuracy: position.coords.accuracy,
    }
    const newLocIsValid = hasLocationData(newLocation)
    userLocation.value = newLocIsValid ? newLocation : defaultLocation
    if (!newLocIsValid) console.error(`Location not in range`)

    if (!gotInitialLocation.value) {
      // if navigator.permissions is 'prompt' or 'granted' resolve both to 'granted' if user allows location services
      userLocationPermissionState.value = 'granted'
      userLocationState.value = gotInitialLocation.value ? 'watching' : 'located'
      gotInitialLocation.value = true
    }
  }

  function locationError(error: GeolocationPositionError) {
    userLocationPermissionState.value = 'denied'
    userLocationState.value = 'unknown'
    console.error(error)
  }

  function clearUserLocation() {
    watchId.value = null
    gotInitialLocation.value = false
    userLocation.value = defaultLocation
    userLocationState.value = 'unknown'
  }

  function endWatch() {
    if (watchId.value) navigator.geolocation.clearWatch(watchId.value)
    clearUserLocation()
  }

  function handleMapGeolocate(locationData: Required<LatLon>) {
    userLocation.value = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      accuracy: locationData.accuracy,
    }
    locationSearchMode.value = undefined
  }

  function handleMapGeolocateError(error: Error | GeolocationPositionError) {
    console.error(error)
  }

  function locationNotDefault(location: MaybeRef<LatLon>) {
    const locVal = toValue(location)
    return (
      locVal.latitude !== defaultLocation.latitude || locVal.longitude !== defaultLocation.longitude
    )
  }

  return {
    userLocation,
    userLocationState,
    locationSearchMode,
    getUserLocation,
    endWatch,
    handleMapGeolocate,
    handleMapGeolocateError,
    locationNotDefault,
  }
}

// verify location is in or near enough to Philadelphia
function checkLongitudeInRange(longitude: number) {
  return -75.35227 < longitude && longitude < -74.91583
}
function checkLatitudeInRange(latitude: number) {
  return 39.84911 < latitude && latitude < 40.175
}
