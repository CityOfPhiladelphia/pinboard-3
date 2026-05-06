import type { LegendItem } from '@pinboard/ui'

/* Map render order: 500 first (under), 100 second (over) so the inner 100-year
 * zone stays visible on top of the wider 500-year zone. */
export const FLOOD_LAYER_IDS = ['500-year', '100-year'] as const
export type FloodLayerId = (typeof FLOOD_LAYER_IDS)[number]

/* Legend display order: most-severe (smallest, most frequent) first. */
const FLOOD_LEGEND_ORDER: FloodLayerId[] = ['100-year', '500-year']

const FEMA_FLOODPLAIN_BASE =
  'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services'
const featureQuery = 'where=1%3D1&outFields=OBJECTID&f=geojson&outSR=4326'

interface FloodLayerSpec {
  url: string
  color: string
  label: string
}

export const FLOOD_LAYER_CONFIG: Record<FloodLayerId, FloodLayerSpec> = {
  '500-year': {
    url: `${FEMA_FLOODPLAIN_BASE}/FEMA_500_Flood_Plain/FeatureServer/0/query?${featureQuery}`,
    color: '#90caf9',
    label: '500-year flood plain',
  },
  '100-year': {
    url: `${FEMA_FLOODPLAIN_BASE}/FEMA_100_flood_Plain/FeatureServer/0/query?${featureQuery}`,
    color: '#1e88e5',
    label: '100-year flood plain',
  },
}

export const FLOOD_LEGEND_ITEMS: LegendItem[] = FLOOD_LEGEND_ORDER.map(id => ({
  value: id,
  label: FLOOD_LAYER_CONFIG[id].label,
  color: FLOOD_LAYER_CONFIG[id].color,
}))
