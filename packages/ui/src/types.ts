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
  title: string
  map?: MapConfig
  /** Where the filter chips sit on mobile: 'map' (under the search bar) or 'sheet' (in the bottom sheet). Defaults to 'sheet'. */
  mobileFilterPlacement?: 'map' | 'sheet'
}

export interface AlertBanner {
  title: string
  message: string
}

export type BasicLocation = {
  id: string
  name: string
  locationCardInfo: MapCardProps
} & LatLon

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

export const Browsers = {
  FIREFOX: 'FIREFOX',
  SAMSUNG: 'SAMSUNG',
  OPERA: 'OPERA',
  EDGE: 'EDGE',
  CHROME: 'CHROME',
  SAFARI: 'SAFARI',
  UNKNOWN: 'UNKNOWN',
} as const

export type BrowserType = (typeof Browsers)[keyof typeof Browsers]
