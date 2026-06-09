// ABOUTME: Resolve a 311 service type to a Fontawesome pin icon via common_categories;
// ABOUTME: neutral location-dot fallback for any unmapped or missing service type.
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
