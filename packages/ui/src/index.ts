import './styles/global.css'
import PinboardShell from './components/PinboardShell.vue'
import PinboardBody from './components/PinboardBody.vue'
import PinboardInfoPage from './components/PinboardInfoPage.vue'
export * as PinboardComposables from './composables/_index'
export * as PinboardUtilities from './utilities/_index'
export { createPinboard } from './plugin'
export { createPinboardRouter } from './router/createPinboardRouter'
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

export { Callout } from '@phila/phila-ui-callout'
export { PhilaLink } from '@phila/phila-ui-link'
export { Tags } from '@phila/phila-ui-tags'
export { Tooltip } from '@phila/phila-ui-tooltip'
export { NavbarInfo } from '@phila/phila-ui-app-header'
export { PinboardShell, PinboardBody, PinboardInfoPage }

export { Icon } from '@phila/phila-ui-core'
export type { FilterDefinition, FilterValues, FilterChoice } from '@phila/phila-ui-core'

export { mergeDeep, languages, languageCodes, pinboardMessages, type Language } from './i18n'
