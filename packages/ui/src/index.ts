import './styles/global.css'
export { createPinboard } from './plugin'
export { PinboardBody, PinboardShell } from './components/_index'
export * as PinboardComposables from './composables/_index'
export * as PinboardUtilities from './utilities/_index'
export type * as PinboardTypes from './types'
export type {
  BitWiseOperation,
  MatchingFunction,
  IFilterChoiceBitfieldGroup,
  IFilterSet,
} from './composables/datafilters/types'
export { FilterChoiceBitfieldGroup, FilterSet } from './composables/datafilters/classes'
export type * as PinboardFilterTypes from './composables/datafilters/types'

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
  type LegendItem,
} from '@phila/phila-ui-map-core'

export { NavbarInfo } from '@phila/phila-ui-app-header'

export type { FilterDefinition, FilterValues, FilterChoice } from '@phila/phila-ui-core'
