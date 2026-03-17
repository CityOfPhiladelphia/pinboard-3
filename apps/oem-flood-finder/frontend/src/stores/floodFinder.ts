import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { usePinboardStore } from '@pinboard/ui'

export const useFloodFinderStore = defineStore('floodFinder', () => {
  const pinboard = usePinboardStore()

  const locationMode = ref<'all' | 'gauges' | 'cameras'>('all')

  const filteredLocations = computed(() => {
    if (locationMode.value === 'all') return pinboard.allLocations
    if (locationMode.value === 'gauges') {
      return pinboard.allLocations.filter(loc =>
        (loc as any).other?.kind === 'Aware' || (loc as any).other?.kind === 'Usgs'
      )
    }
    return pinboard.allLocations.filter(loc => (loc as any).other?.kind === 'Camera')
  })

  return { locationMode, filteredLocations }
})
