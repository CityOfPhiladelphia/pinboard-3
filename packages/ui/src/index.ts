import './styles/global.css'
export { createPinboard } from './plugin'
export { createPinboardRouter } from './router/createPinboardRouter'
export {
  PinboardBody,
  PinboardShell,
  PinboardInfoPage,
  DetailActions,
  DrawingCanvas,
  LoadingCards,
  LocationThumbnail,
} from './components/_index'
export * as PinboardComposables from './composables/_index'
export * as PinboardUtilities from './utilities/_index'
export type * as PinboardTypes from './types'
export type * from './composables/datafilters/types'
export { getBufferSize, applyFilters } from './composables/datafilters/functions'
export {
  FilterChoiceBitfieldGroup,
  FilterGroup,
  FilterChoiceBitfield,
} from './composables/datafilters/classes'
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

export { MapCard, type MapCardProps } from '@phila/phila-ui-cards'
export { Callout } from '@phila/phila-ui-callout'
export { PhilaLink } from '@phila/phila-ui-link'
export { Tags } from '@phila/phila-ui-tags'
export { Tooltip } from '@phila/phila-ui-tooltip'
export { NavbarInfo } from '@phila/phila-ui-app-header'
export type { NavLink } from '@phila/phila-ui-app-header'
export { PinboardBody as Pinboard } from './components/_index'

export { Icon } from '@phila/phila-ui-core'
export type { FilterDefinition, FilterValues, FilterChoice } from '@phila/phila-ui-core'

export { mergeDeep, languages, languageCodes, pinboardMessages, type Language } from './i18n'
export * from './keys'
