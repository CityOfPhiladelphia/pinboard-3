import { ref, onMounted, type Ref } from 'vue'
import type { State } from '@pinboard/ui'
import type { PrimaryCareLocation } from '@/types'

const ARCGIS_URL = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/red_PrimaryCare/FeatureServer/0/query'

function isVisible(feature: any): boolean {
  const props = feature.properties

  // Exclude incomplete records
  if (props.data_complete !== '2') return false

  // Exclude test records
  if (['3', '5', '6', '7', '8', '9'].includes(props.record)) return false

  // Exclude test addresses
  if (props.address === 'Test') return false

  return true
}

export function useLocations(): Ref<State> {
  const state = ref<State>({ kind: 'Loading' })

  async function fetchLocations() {
    try {
      const params = new URLSearchParams({
        where: '1=1',
        outFields: '*',
        f: 'geojson',
      })

      const response = await fetch(`${ARCGIS_URL}?${params}`)

      if (!response.ok) {
        state.value = { kind: 'Error', message: 'Error retrieving primary care sites' }
        return
      }

      const rawGeojson = await response.json()
      const filteredFeatures = rawGeojson.features.filter(isVisible)

      const locations: PrimaryCareLocation[] = filteredFeatures.map((feature: any) => ({
        id: String(feature.properties.objectid),
        properties: feature.properties,
        geometry: feature.geometry,
      }))

      const geojson = {
        type: 'FeatureCollection' as const,
        features: filteredFeatures.map((f: any) => ({
          ...f,
          properties: { ...f.properties, id: String(f.properties.objectid) },
        })),
      }

      state.value = { kind: 'Loaded', data: locations, geojson }
    } catch {
      state.value = { kind: 'Error', message: 'Error retrieving primary care sites' }
    }
  }

  onMounted(fetchLocations)
  return state
}
