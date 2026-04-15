import { ref, readonly, type Ref, type DeepReadonly } from 'vue'

export type UserCoords = {
  longitude: number
  latitude: number
  accuracy: number
}

const userCoords = ref<UserCoords | null>(null)

export function useUserLocation(): {
  userCoords: DeepReadonly<Ref<UserCoords | null>>
  setUserLocation: (coords: UserCoords) => void
} {
  return {
    userCoords: readonly(userCoords),
    setUserLocation: (coords) => {
      userCoords.value = coords
    },
  }
}
