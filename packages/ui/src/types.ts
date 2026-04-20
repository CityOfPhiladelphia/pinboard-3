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

export type MenuOption = Readonly<{
  text: string
  value: string
}>

export type SortLocationsOptions = Readonly<{
  [key: string]: string
}>

export type AisAutocompleteResult = Readonly<{
  query: string
  query_type: string
  count: number
  results: Readonly<{
    placenames: string[]
    addresses: Readonly<
      {
        address: string
        search_address: string
        has_opa: boolean
      }[]
    >
  }>
}>

export const Zipcode = /^\d{5}(?:-\d{4})?$/
export const StreetAddress =
  /^(?:\d{1,5}(?:-\d{1,5})?[A-Za-z]{0,3} )(?:(?:(?:[NnSs](?:[Oo][RrUu][Tt][Hh])?)|(?:[EeWw](?:[AaEe][Ss][Tt])?)){0,2} )?(?:\w+ )(?:\w{2,})$/
