export { default as Pinboard } from './components/Pinboard.vue'
export { createPinboard } from './plugin'
export type { PinboardConfig, MapConfig } from './types'

// Re-export map-core layer components so apps use the same MapLibre instance as PhilaMap
export {
  CircleLayer,
  LineLayer,
  FillLayer,
  SymbolLayer,
  RasterLayer,
  MapMarker,
  MapIconTextPin,
} from '@phila/phila-ui-map-core'
