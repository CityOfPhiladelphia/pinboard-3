import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { State, Location } from '../types'

export const usePinboardStore = defineStore('pinboard', () => {
  const appData = ref<State>({ kind: 'Loading' })
  const allLocations = computed(() =>
    appData.value.kind === 'Loaded' ? appData.value.data : []
  )
  const geojson = computed(() =>
    appData.value.kind === 'Loaded' ? appData.value.geojson : undefined
  )

  // UI state
  const finderActive = ref(false)
  const activePanel = ref<'locations' | 'map'>('locations')
  const selectedLocationId = ref<string | null>(null)
  const hoveredId = ref<string | null>(null)
  // Derived
  const selectedLocation = computed(() =>
    allLocations.value.find(loc => loc.id === selectedLocationId.value) ?? null
  )
  const detailOpen = computed(() => selectedLocationId.value !== null)

  // Clear selection if the selected location disappears from the data
  watch(allLocations, (data) => {
    if (selectedLocationId.value && !data.some(loc => loc.id === selectedLocationId.value)) {
      selectedLocationId.value = null
    }
  })

  // Actions
  function setAppData(newState: State) {
    appData.value = newState
  }

  function selectLocation(location: Location) {
    if (selectedLocationId.value === location.id) {
      selectedLocationId.value = null
      return
    }
    selectedLocationId.value = location.id
    finderActive.value = true
  }

  function clearSelection() {
    selectedLocationId.value = null
  }

  function hoverLocation(id: string | null) {
    hoveredId.value = id
  }

  function activateFinder() {
    finderActive.value = true
  }

  function deactivateFinder() {
    finderActive.value = false
  }

  function togglePanel() {
    activePanel.value = activePanel.value === 'locations' ? 'map' : 'locations'
  }

  return {
    appData,
    allLocations,
    geojson,
    finderActive,
    activePanel,
    selectedLocationId,
    hoveredId,
    selectedLocation,
    detailOpen,
    setAppData,
    selectLocation,
    clearSelection,
    hoverLocation,
    activateFinder,
    deactivateFinder,
    togglePanel,
  }
})
