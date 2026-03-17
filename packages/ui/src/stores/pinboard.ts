import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import type { State } from '../types'

export const usePinboardStore = defineStore('pinboard', () => {
  // Internal — not exposed. Consumers use the derived computeds below.
  const _appData = ref<State>({ kind: 'Loading' })

  const isLoading = computed(() => _appData.value.kind === 'Loading')
  const isLoaded = computed(() => _appData.value.kind === 'Loaded')
  const errorMessage = computed(() =>
    _appData.value.kind === 'Error' ? _appData.value.message : null
  )
  const allLocations = computed(() =>
    _appData.value.kind === 'Loaded' ? _appData.value.data : []
  )
  const geojson = computed(() =>
    _appData.value.kind === 'Loaded' ? _appData.value.geojson : undefined
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
    _appData.value = newState
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
    isLoading,
    isLoaded,
    errorMessage,
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
