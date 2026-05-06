import PinboardShell from './components/PinboardShell.vue'
import PinboardBody from './components/PinboardBody.vue'
export * as PinboardComposables from './composables/_index'
export * as PinboardUtilities from './utilities/_index'
export { createPinboard } from './plugin'
export type * as PinboardTypes from './types'

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
  MapCheckboxLegend,
} from '@phila/phila-ui-map-core'
export type { LegendItem } from '@phila/phila-ui-map-core'

export { NavbarInfo } from '@phila/phila-ui-app-header'
export { PinboardShell, PinboardBody as Pinboard }
