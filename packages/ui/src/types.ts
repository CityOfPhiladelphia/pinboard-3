// packages/ui/src/types.ts
import type { MapCardProps } from '@phila/phila-ui-cards'

export type Latitude = number
export type Longitude = number

export type LongitudeLatitude = [Longitude, Latitude]

export interface LatLon {
  latitude: Latitude
  longitude: Longitude
}

export interface ZipcodePolygon {
  centroid: LatLon
  nodes: LongitudeLatitude[]
}

export type LocationPermissionState = 'granted' | 'prompt' | 'denied'

export type UserLocationState = 'unknown' | 'acquiring' | 'located' | 'watching'

export type MapControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface MapConfig {
  center?: LongitudeLatitude
  zoom?: number
  pitch?: number
  bearing?: number
  minZoom?: number
  maxZoom?: number
  basemapChangeControls?: {
    toggle?: boolean
    dropdown?: boolean
    position?: MapControlPosition
  }
  navigationControls?: { position?: MapControlPosition }
  geolocationControl?: { position?: MapControlPosition }
  mapSearchControl?: { position?: MapControlPosition; placeholder?: string }
  ariaLabel?: string
  mobile?: {
    center?: LongitudeLatitude
    zoom?: number
  }
}

export interface PinboardConfig {
  title?: string
  map?: MapConfig
  /** Where the filter chips sit on mobile: 'map' (under the search bar) or 'sheet' (in the bottom sheet). Defaults to 'sheet'. */
  mobileFilterPlacement?: 'map' | 'sheet'
}

export interface AlertBanner {
  title: string
  message: string
}

export interface BasicLocation extends LatLon, Record<string, unknown> {
  id: string
  name: string
  locationCardInfo: MapCardProps
}

export interface LocationFilterOption {
  readonly value: string
  readonly label: string
}

export type SearchMode = 'address' | 'zipcode' | 'keyword' | undefined

export interface MenuOption {
  text: string
  value: string
}

export type SortLocationsOptions = Record<string, string>

export type ProxyAutocompleteResult = string[]

export interface CartoResponse {
  rows: [
    {
      cartodb_id: number
      the_geom: string
      the_geom_webmercator: string
      objectid: number
      [x: string]: unknown
    },
  ]
}
export interface ArcgisFeature {
  type: string
  id: number | string
  geometry: {
    type: string
    coordinates: LongitudeLatitude
  }
  properties: unknown
}
export interface ArcgisResponse {
  type: string
  features: ArcgisFeature[]
}

// type GeoJsonGeometryType =
//   | 'Point'
//   | 'MultiPoint'
//   | 'LineString'
//   | 'MultiLineString'
//   | 'Polygon'
//   | 'MultiPolygon'
//   | 'GeometryCollection'

// type GeoJsonType = GeoJsonGeometryType | 'Feature' | 'FeatureCollection'

// type GeoJsonCoordinate = [number, number] | [number, number, number] | [number, number, number, number]

// interface GeoJsonPoint {
//   type: Extract<GeoJsonGeometryType, 'Point'>
//   coordinates: GeoJsonCoordinate
// }

// interface GeoJsonLineString {
//   type: Extract<GeoJsonGeometryType, 'LineString'>
//   coordinates: GeoJsonCoordinate[]
// }

// export interface GeoJSON {
//   type: GeoJsonType
// }
