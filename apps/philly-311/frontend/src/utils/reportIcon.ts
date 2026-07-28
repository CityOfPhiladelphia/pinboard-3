// ABOUTME: Resolve a 311 service type to a phila-ui pin icon via common_categories;
// ABOUTME: neutral location-dot fallback for any unmapped or missing service type.
import type { FunctionalComponent, SVGAttributes } from 'vue'
import {
  IconRoad,
  IconBoxArchive,
  IconLightbulb,
  IconSprayCan,
  IconCar,
  IconTrashCan,
  IconRecycle,
  IconTree,
  IconPersonWalking,
  IconWater,
  IconLocationDot,
} from '@phila/phila-ui-core/icons'
import commonCategories from '@/data/common_categories.json'

type IconComponent = FunctionalComponent<SVGAttributes>

const ICONS: Record<string, IconComponent> = {
  road: IconRoad,
  // phila-icons has no dumpster glyph; BoxArchive is the closest bin shape.
  dumpster: IconBoxArchive,
  lightbulb: IconLightbulb,
  'spray-can': IconSprayCan,
  car: IconCar,
  trash: IconTrashCan,
  recycle: IconRecycle,
  tree: IconTree,
  'person-walking': IconPersonWalking,
  water: IconWater,
}

const BY_TITLE: Record<string, IconComponent> = Object.fromEntries(
  commonCategories
    .map((c) => [c.title, ICONS[c.iconName]] as const)
    .filter((e): e is [string, IconComponent] => e[1] !== undefined),
)

// Icon components are imported constants, so identity is stable by construction —
// consumers can key v-for/props off the returned reference safely.
export function serviceTypeIconComponent(serviceType: string | undefined | null): IconComponent {
  if (!serviceType) return IconLocationDot
  return BY_TITLE[serviceType] ?? IconLocationDot
}
