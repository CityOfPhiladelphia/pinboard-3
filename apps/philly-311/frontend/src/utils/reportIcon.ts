// ABOUTME: Resolve a 311 service type to a Fontawesome pin icon via common_categories;
// ABOUTME: neutral location-dot fallback for any unmapped or missing service type.
import { h } from 'vue'
import type { FunctionalComponent, SVGAttributes } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faRoad,
  faDumpster,
  faLightbulb,
  faSprayCan,
  faCar,
  faTrash,
  faRecycle,
  faTree,
  faPersonWalking,
  faWater,
  faLocationDot,
} from '@fortawesome/pro-solid-svg-icons'
import commonCategories from '@/data/common_categories.json'

const ICONS: Record<string, IconDefinition> = {
  road: faRoad,
  dumpster: faDumpster,
  lightbulb: faLightbulb,
  'spray-can': faSprayCan,
  car: faCar,
  trash: faTrash,
  recycle: faRecycle,
  tree: faTree,
  'person-walking': faPersonWalking,
  water: faWater,
}

const BY_TITLE: Record<string, IconDefinition> = Object.fromEntries(
  commonCategories
    .map((c) => [c.title, ICONS[c.iconName]] as const)
    .filter((e): e is [string, IconDefinition] => e[1] !== undefined),
)

export function serviceTypeIconDefinition(serviceType: string | undefined | null): IconDefinition {
  if (!serviceType) return faLocationDot
  return BY_TITLE[serviceType] ?? faLocationDot
}

// Cached per definition so consumers get a stable component identity —
// an unstable identity would remount the icon on every parent re-render.
const ICON_COMPONENTS = new Map<IconDefinition, FunctionalComponent<SVGAttributes>>()

export function serviceTypeIconComponent(
  serviceType: string | undefined | null,
): FunctionalComponent<SVGAttributes> {
  const definition = serviceTypeIconDefinition(serviceType)
  let component = ICON_COMPONENTS.get(definition)
  if (!component) {
    component = (attrs) => h(FontAwesomeIcon, { ...attrs, icon: definition })
    ICON_COMPONENTS.set(definition, component)
  }
  return component
}
