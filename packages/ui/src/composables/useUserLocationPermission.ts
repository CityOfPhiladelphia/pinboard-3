import { ref } from 'vue'
import type { LocationPermissionState } from '../types'

const userLocationPermission = ref<LocationPermissionState>('granted')

export function useUserLocationPermission() {
  navigator.permissions
    .query({ name: 'geolocation' })
    .then((permissionStatus) => {
      userLocationPermission.value = permissionStatus.state
      permissionStatus.onchange = () => {
        userLocationPermission.value = permissionStatus.state
        console.log('Permission changed: ', permissionStatus.state)
      }
    })

  return { userLocationPermission }
}
