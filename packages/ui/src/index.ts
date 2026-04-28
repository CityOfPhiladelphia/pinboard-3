import PinboardShell from './components/PinboardShell.vue'
import Pinboard from './components/Pinboard.vue'
export { createPinboard } from './plugin'
export type { PinboardConfig, MapConfig } from './types'
export { useUserLocation } from './composables/useUserLocation'

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

export { PinboardShell, Pinboard }
