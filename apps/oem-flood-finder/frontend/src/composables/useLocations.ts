import { ref, onMounted } from 'vue'
import type { Location } from '../types'

export function useLocations() {
  const locations = ref<Location[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  async function fetchLocations() {
    isLoading.value = true
    error.value = null
    try {
      // TODO: replace with API call
      locations.value = [
        { name: 'Pennypack Creek at Holmesburg', address: '7000 State Rd, Philadelphia, PA 19135' },
        {
          name: 'Tacony Creek at Cheltenham Ave',
          address: '900 Cheltenham Ave, Philadelphia, PA 19111',
        },
        {
          name: 'Cobbs Creek at Baltimore Ave',
          address: '6200 Baltimore Ave, Philadelphia, PA 19143',
        },
        {
          name: 'Wissahickon Creek at Bells Mill Rd',
          address: '300 Bells Mill Rd, Philadelphia, PA 19118',
        },
        {
          name: 'Darby Creek at Lansdowne Ave',
          address: '5800 Lansdowne Ave, Philadelphia, PA 19131',
        },
      ]
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
    } finally {
      isLoading.value = false
    }
  }

  onMounted(fetchLocations)

  return { locations, isLoading, error }
}
