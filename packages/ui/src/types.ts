// packages/ui/src/types.ts
import type { InjectionKey, Ref, Slots } from 'vue'

export type MapControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export interface MapConfig {
  center?: [number, number]
  zoom?: number
  pitch?: number
  bearing?: number
  minZoom?: number
  maxZoom?: number
  basemapChangeControls?: { toggle?: boolean; dropdown?: boolean; position?: MapControlPosition }
  navigationControls?: { position?: MapControlPosition }
  geolocationControl?: { position?: MapControlPosition }
  mapSearchControl?: { position?: MapControlPosition; placeholder?: string }
  ariaLabel?: string
}

export interface Location {
  id: string
  [key: string]: unknown
}

export type State =
  | { kind: 'Loading' }
  | { kind: 'Loaded'; data: Location[] }
  | { kind: 'Error'; message: string }

export interface PinboardConfig {
  title: string
  useLocations: () => Ref<State>
  map?: MapConfig
}

export const PINBOARD_CONFIG_KEY: InjectionKey<PinboardConfig> = Symbol('pinboard-config')
export const PINBOARD_SLOTS_KEY: InjectionKey<Slots> = Symbol('pinboard-slots')
