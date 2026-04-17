// packages/ui/src/types.ts
import type { InjectionKey } from 'vue'
import type { MapCardProps } from '@phila/phila-ui-cards'

export type MapControlPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export interface MapConfig {
  center?: [number, number]
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
    center?: [number, number]
    zoom?: number
  }
}

export interface PinboardConfig {
  title: string
  map?: MapConfig
}

export type AlertBanner = {
  title: string
  message: string
}

export const PINBOARD_CONFIG_KEY: InjectionKey<PinboardConfig> =
  Symbol('pinboard-config')

export type BasicLocation = {
  id: string
  name: string
  latitude: number
  longitude: number
  locationCardInfo: MapCardProps
}

export type LocationFilterOption = {
  readonly value: string
  readonly label: string
}

export type SearchMode = 'address' | 'zipcode' | 'keyword' | false

export type SortLocationsOptions = {
  readonly None: 'Sort'
  readonly [key: string]: string
}

export const SortLocationsNone: SortLocationsOptions = {
  None: 'Sort',
}

export type SortLocationsValues =
  (typeof SortLocationsNone)[keyof typeof SortLocationsNone]

export type AisAutocompleteResult = {
  query: string
  query_type: string
  count: number
  results: {
    placenames: string[]
    addresses: {
      address: string
      search_address: string
      has_opa: boolean
    }[]
  }
}

export const Zipcode = /^\d{5}(?:-\d{4})?$/
export const StreetAddress =
  /^(?:\d{1,5}(?:-\d{1,5})?[A-Za-z]{0,3} )(?:(?:(?:[NnSs](?:[Oo][RrUu][Tt][Hh])?)|(?:[EeWw](?:[AaEe][Ss][Tt])?)){0,2} )?(?:\w+ )(?:\w{2,})$/
