export { default as Pinboard } from './components/Pinboard.vue'
export { createPinboard } from './plugin'
export type { PinboardConfig, MapConfig, State, Location } from './types'
export { usePinboardStore } from './stores/pinboard'

// Re-export map-core layer components so apps use the same MapLibre instance as PhilaMap
export {
  CircleLayer,
  LineLayer,
  FillLayer,
  SymbolLayer,
  RasterLayer,
  MapMarker,
  MapIconTextPin,
  MapNavigationControl,
  GeolocationButton,
  BasemapToggle,
} from '@phila/phila-ui-map-core'
