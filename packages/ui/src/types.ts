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

export type Location = {
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

export enum SortLocationsValues {
  None,
  AlphaAsc,
  AlphaDes,
  DistAsc,
  DistDes,
}
