import { ref, watch } from 'vue'
import type {
  GeoLocation,
  GeolocationOptions,
  Latitude,
  LocationPermissionState,
  Longitude,
  UserLocationState,
} from '../types'
import { hasLocationData } from '../utilities/hasLocationData'

export function useUserLocation(
  options: GeolocationOptions = {
    timeout: Infinity,
    promptOnPageLoad: false,
    watchLocation: false,
    enableHighAccuracy: false,
  }
) {
  const promptOnPageLoad = options?.promptOnPageLoad || false
  const watchLocation = options?.watchLocation || false
  const geolocationOptions = {
    timeout: options?.timeout || Infinity,
    maximumAge: 0,
    enableHighAccuracy: options.enableHighAccuracy,
  }

  const userLocation = ref<GeoLocation>({
    latitude: NaN,
    longitude: NaN,
    accuracy: NaN,
  })
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
    (newPermissionState, oldPermissionState) => {
      switch (newPermissionState) {
        case 'granted':
        case 'prompt': {
          if (!gotInitialLocation.value) {
            getUserLocation()
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

  watch(
    userLocationState,
    (newState, oldState) => {
      console.log('newState: ', newState)
      if (newState === 'acquiring' && newState !== oldState) {
        getUserLocation()
      }
    },
    {
      immediate: true,
    }
  )

  function getUserLocation() {
    userLocationState.value = 'acquiring'
    navigator.geolocation.getCurrentPosition(locationSuccess, locationError, geolocationOptions)
  }

  function locationSuccess(position: GeolocationPosition) {
    // only show location on map if user is in or near Philly
    const newLat = checkLatitudeInRange(position.coords.latitude) ? position.coords.latitude : NaN
    const newLon = checkLongitudeInRange(position.coords.longitude)
      ? position.coords.longitude
      : NaN

    userLocation.value = hasLocationData({ latitude: newLat, longitude: newLon })
      ? {
          latitude: newLat,
          longitude: newLon,
          accuracy: position.coords.accuracy,
        }
      : { latitude: NaN, longitude: NaN, accuracy: NaN }

    if (Number.isNaN(userLocation.value.latitude)) console.error(`Location not in range`)

    if (!gotInitialLocation.value) {
      // if navigator.permissions is 'prompt' or 'granted' resolve both to 'granted' if user allows location services
      userLocationPermissionState.value = 'granted'
      userLocationState.value = 'located'
      gotInitialLocation.value = true
    } else {
      userLocationState.value = 'watching'
    }
  }

  function locationError(error: GeolocationPositionError) {
    console.error(error.message)
    switch (error.code) {
      case error.PERMISSION_DENIED: {
        userLocationPermissionState.value = 'denied'
        userLocationState.value = 'unknown'
        break
      }
      case error.POSITION_UNAVAILABLE:
      case error.TIMEOUT: {
        if (userLocationPermissionState.value !== 'denied') getUserLocation()
      }
    }
  }

  function clearUserLocation() {
    watchId.value = null
    gotInitialLocation.value = false
    userLocation.value.latitude = NaN
    userLocation.value.longitude = NaN
    userLocationState.value = 'unknown'
  }

  function endWatch() {
    if (watchId.value) {
      navigator.geolocation.clearWatch(watchId.value)
    }
    clearUserLocation()
  }

  function handleGeolocate(locationData: GeoLocation) {
    userLocation.value = locationData
  }

  function handleGeolocateError(error: Error | GeolocationPositionError) {
    console.error(error)
  }

  return {
    userLocation,
    userLocationState,
    getUserLocation,
    endWatch,
    handleGeolocate,
    handleGeolocateError,
  }
}

// verify location is in or near enough to Philadelphia
function checkLatitudeInRange(latitude: Latitude) {
  return 39.84911 < latitude && latitude < 40.175
}

function checkLongitudeInRange(longitude: Longitude) {
  return -75.35227 < longitude && longitude < -74.91583
}
