// packages/ui/src/types.ts
import type { MapCardProps } from '@phila/phila-ui-cards'
import type { Ref } from 'vue'

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

export type SortMode = 'AlphaAsc' | 'AlphaDesc' | 'DistAsc' | 'DistDesc' | ''

export type SortFunction<T> = (locations: Ref<T[]> | T[]) => T[]

export interface CustomSort<T> extends Partial<Record<SortMode, SortFunction<T>>> {
  AlphaAsc: SortFunction<T>
  AlphaDesc: SortFunction<T>
  DistAsc: SortFunction<T>
  DistDesc: SortFunction<T>
  default: SortFunction<T>
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
  /** Namespaces per-app browser storage (e.g. recent searches) so same-origin finders don't share it. */
  appId?: string
}

export interface AlertBanner {
  title: string
  message: string
}

export interface BasicLocation extends LatLon {
  id: string
  name: string
  distance?: string | undefined
  locationCardInfo?: MapCardProps
}

export type MapCardPropsGetter<PinboardLocation extends BasicLocation> = (
  location: PinboardLocation
) => MapCardProps

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

export interface CartoResponseFields {
  cartodb_id: number
  the_geom: string
  the_geom_webmercator: string
}

export interface CartoResponse {
  rows: CartoResponseFields[]
}

export interface GeoJsonFeature {
  type: 'Feature'
  geometry: {
    type: string
    coordinates: LongitudeLatitude
  }
  properties: unknown
}

export interface ArcgisFeature extends GeoJsonFeature {
  id: number
}

export interface GeoJSONFeatureCollectionResponse {
  type: 'FeatureCollection'
  features: ArcgisFeature[] | GeoJsonFeature[]
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
