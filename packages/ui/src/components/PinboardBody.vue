<script setup lang="ts">
// vue imports
import { useSlots, inject, ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

// 3rd party imports
import { IconMap } from '@phila/phila-ui-core/icons'

// philly ui imports
import '@phila/phila-ui-core/styles/template-light.css'
import '@phila/phila-ui-bottom-sheet/dist/phila-ui-bottom-sheet.css'
import { BottomSheet } from '@phila/phila-ui-bottom-sheet'
import { MapCard } from '@phila/phila-ui-cards'

// import pinboard config
import { PINBOARD_CONFIG_KEY } from '../plugin'

// pinboard component imports
import MapPanel from './MapPanel.vue'
import LocationsPanel from './LocationsPanel.vue'
import { FilterChipGroup } from '@phila/phila-ui-filter-chip'
import { FilterPanel } from '@phila/phila-ui-filter-panel'

// pinboard composables and utilities imports
import { hasLocationData } from '../utilities/hasLocationData'

// type imports
import type {
  BasicLocation,
  LatLon,
  LocationFilterOption,
  SearchMode,
  SortLocationsOptions,
  UserLocationState,
} from '../types'
import type { FilterDefinition, FilterValues } from '@phila/phila-ui-core'

// slots
defineSlots<{
  nav?(): unknown
  'locations-header'?: unknown
  'location-card'?(props: { location: BasicLocation }): unknown
  'location-detail'?(props: { location: BasicLocation; onClose: () => void }): unknown
  'map-content'?(props: {
    locations: BasicLocation[]
    geojson: unknown
    map: unknown
    zoom: number
    hoveredId: string | null
    selectedId: string | null
    mobileControlsTarget: HTMLDivElement | null
    mobileControlsTargetLeft: HTMLDivElement | null
    onHover: (id: string) => void
    onHoverEnd: () => void
    onSelect: (loc: BasicLocation) => void
  }): unknown
}>()

// props
const props = withDefaults(
  defineProps<{
    locations: BasicLocation[]
    isMobile: boolean
    errorMessage: string | null
    searchOrUserLocation: LatLon
    isLoading: string | false
    waitForUserLocation?: boolean
    userLocationState?: UserLocationState
    locationPanelFilter?: LocationFilterOption[]
    locationPanelSearch?: string
    locationPanelSort?: SortLocationsOptions
    locationSearchMode?: SearchMode
    geojson?: unknown
    filters?: FilterDefinition[]
    filterValues?: FilterValues
  }>(),
  {
    waitForUserLocation: false,
    userLocationState: 'unknown',
    locationPanelFilter: undefined,
    locationPanelSearch: undefined,
    locationPanelSort: undefined,
    locationSearchMode: undefined,
    geojson: undefined,
    filters: undefined,
    filterValues: undefined,
  }
)

// emits to parent app to handle
const emit = defineEmits<{
  search: [search: string]
  selectedLocationsFilter: [filter: string]
  sortLocationsOption: [sort: string]
  deselect: [locationId: string]
  'update:filterValues': [value: FilterValues]
}>()

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// component variables
const snapPoints = [15, 50, 100]
const config = inject(PINBOARD_CONFIG_KEY)
// Mobile: chips render under the on-map search bar when 'map', else in the bottom sheet.
const chipsOnMap = computed(() => config?.mobileFilterPlacement === 'map')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const slots: Record<string, any> = useSlots()

// refs
const hoveredLocationId = ref<string | undefined>(undefined)
const selectedLocation = ref<BasicLocation | undefined>(undefined)
const bottomSheetOpen = ref(true)
const bottomSheetRef = ref<{
  snapTo: (index: number) => void
  displayPercent: number
  isDragging: boolean
} | null>(null)
const mobileControlsTarget = ref<HTMLDivElement | null>(null)
const mobileControlsTargetLeft = ref<HTMLDivElement | null>(null)
const locationsPanelRef = ref<{
  scrollToCard: (id: string, behavior?: ScrollBehavior) => void
} | null>(null)
const mapPanelRef = ref<{ panTo: (coordinates: LatLon) => void } | null>(null)
const searchString = ref<string>('')
// filter state
const allFiltersOpen = ref(false)

// computed refs
const bottomSheetPercent = computed(() => bottomSheetRef.value?.displayPercent ?? snapPoints[0])

const bottomSheetDragging = computed(() => bottomSheetRef.value?.isDragging ?? false)

const mobileControlsStyle = computed(() => {
  const percent = bottomSheetPercent.value
  const opacity = percent <= 50 ? 1 : Math.max(0, 1 - (percent - 50) / 20)
  return {
    bottom: `calc(${percent}% + 10px)`,
    opacity,
    transition: bottomSheetDragging.value ? 'none' : 'bottom 0.3s ease-out, opacity 0.3s ease-out',
  }
})

const selectedLocationId = computed(() =>
  selectedLocation.value === undefined ? undefined : selectedLocation.value.id
)

const locationCountLabel = computed(() => {
  const message = props.locations.length
    ? t('pinboard.itemCount', { count: props.locations.length }, props.locations.length)
    : t('pinboard.noLocations')
  return props.isLoading || message
})

// Filter chips in use bubble up to sit right after the (pinned) Sort chip. The
// order is a snapshot recomputed only at safe moments — initial load, a chip's
// dropdown closing, and the All-Filters panel closing — never live while a
// dropdown is open, so a chip never moves out from under its own popover.
const chipOrderKeys = ref<string[]>([])

function recomputeChipOrder() {
  const all = props.filters ?? []
  const values = props.filterValues ?? {}
  const isActive = (key: string) => {
    const v = values[key]
    return v && typeof v === 'object' ? Object.values(v).some(Boolean) : v === true
  }
  const pinned = all.filter((f) => f.excludeFromCount)
  const rest = all.filter((f) => !f.excludeFromCount)
  chipOrderKeys.value = [
    ...pinned,
    ...rest.filter((f) => isActive(f.key)),
    ...rest.filter((f) => !isActive(f.key)),
  ].map((f) => f.key)
}

// Map the snapshot order onto the current filter definitions, so locale/label
// changes still flow through while the order stays put. Any filter not yet in the
// snapshot falls back to source order at the end.
const orderedChipFilters = computed(() => {
  const all = props.filters ?? []
  if (!chipOrderKeys.value.length) return all
  const byKey = new Map(all.map((f) => [f.key, f]))
  const ordered = chipOrderKeys.value
    .map((k) => byKey.get(k))
    .filter((f): f is FilterDefinition => !!f)
  const known = new Set(chipOrderKeys.value)
  return [...ordered, ...all.filter((f) => !known.has(f.key))]
})

// Seed on load and refresh on locale (filters) changes. Otherwise the order only
// updates on dropdown-close / panel-close (wired in the template + watcher below).
watch(
  () => props.filters,
  () => recomputeChipOrder(),
  { immediate: true }
)

// watchers
watch(selectedLocation, (loc) => {
  if (loc) {
    // Mutual exclusion: the detail panel and the filter panel share the left
    // slot, so selecting a location closes the filter panel. Covers every
    // selection path (map click, list click, URL/back-forward nav).
    allFiltersOpen.value = false
    if (props.isMobile) {
      bottomSheetRef.value?.snapTo(snapPoints.length - 1)
    }
  }
})

// Defensive: enforce the "one left panel at a time" invariant in state. Not
// reachable in the current UI (an open detail overlay covers the Filters
// button), but keeps the invariant if the structural cleanup (bead
// pinboard-3-nag) later makes filters reachable with a detail open. Desktop
// only: on mobile the filter panel is full-screen and leaving the detail in
// state returns the user to it when the filters close.
watch(allFiltersOpen, (open) => {
  if (open && !props.isMobile) {
    handleCloseLocationDetail()
  }
  // Reorder chips to reflect what was toggled in the panel, once it's closed.
  if (!open) recomputeChipOrder()
})

// Reflect the selected location in the URL as ?location=<id>. push (not replace) so Back walks
// the selection history. Guarded so it never re-pushes a value the URL already has — that guard
// is also what stops it looping with the route → selection watcher below.
watch(selectedLocationId, (id) => {
  const desired = id ?? undefined
  if (route.query.location === desired) return
  const query = { ...route.query }
  if (desired === undefined) delete query.location
  else query.location = desired
  router.push({ query })
})

// The URL is the source of truth for selection. Resolve ?location= against the loaded locations:
// on initial mount (immediate), when the data finishes loading, and on Back/Forward. An absent or
// unknown id clears the selection (graceful). Direct set (not selectLocation) so it doesn't re-push;
// it also intentionally skips the deselect/visited-tracking emit — URL-driven nav doesn't mark visited.
function resolveLocationFromRoute() {
  const param = route.query.location
  const id = typeof param === 'string' ? param : undefined
  if (id === selectedLocationId.value) return
  const match = id ? props.locations.find((loc) => loc.id === id) : undefined
  selectedLocation.value = match ?? undefined
  if (match) mapPanelRef.value?.panTo(match)
}
watch([() => route.query.location, () => props.locations], resolveLocationFromRoute, {
  immediate: true,
})

watch(
  () => props.searchOrUserLocation,
  (newLocation) => {
    if (
      hasLocationData(newLocation) &&
      props.locationSearchMode &&
      ['address', 'zipcode'].includes(props.locationSearchMode)
    ) {
      mapPanelRef.value?.panTo(newLocation)
    }
  },
  { deep: 1 }
)

// event handlers
function handleHover(id: string) {
  hoveredLocationId.value = id
}

function handleHoverEnd() {
  hoveredLocationId.value = undefined
}

function selectLocation(location: BasicLocation) {
  // Swapping to a different location counts as "viewing" the outgoing one —
  // emit deselect so consumers can mark it as visited.
  if (selectedLocation.value && selectedLocation.value.id !== location.id) {
    emit('deselect', selectedLocation.value.id)
  }
  selectedLocation.value = location
}

function handleSelect(location: BasicLocation) {
  selectLocation(location)
  mapPanelRef.value?.panTo(location)
}

function handleMapSelect(location: BasicLocation) {
  if (selectedLocation.value?.id === location.id) {
    handleCloseLocationDetail()
  } else {
    selectLocation(location)
  }
}

function handleLocationFilterChange(selectedLocationsFilter: string) {
  emit('selectedLocationsFilter', selectedLocationsFilter)
}

function handleLocationSortChange(sortLocationsOption: string) {
  emit('sortLocationsOption', sortLocationsOption)
}

function handleSearchChange(search: string) {
  searchString.value = search
  if (!searchString.value) {
    emit('search', '')
  }
}

function handleSearchSubmit() {
  emit('search', searchString.value)
}

function handleCloseLocationDetail() {
  const closedId = selectedLocation.value?.id ?? null
  if (closedId) {
    emit('deselect', closedId)
  }

  if (props.isMobile && closedId) {
    bottomSheetRef.value?.snapTo(1)
    // Re-center the card in the shrunken list viewport AFTER the sheet
    // snap animation finishes. Keep the list hidden (selectedLocation
    // still truthy) during the snap so the user doesn't see the card
    // drift, then reveal at the correct position via an instant scroll.
    setTimeout(() => {
      locationsPanelRef.value?.scrollToCard(closedId, 'instant')
      selectedLocation.value = undefined
    }, 350)
  } else {
    selectedLocation.value = undefined
  }
}

function handleApplyFilter(value: FilterValues) {
  emit('update:filterValues', value)
}

// utility functions
const effectiveMapConfig = (() => {
  // Merge mobile overrides into the map config ONCE at setup — not reactively.
  // Once the map is initialized, we don't want it to re-center or re-zoom if
  // the user changes orientation or resizes across the breakpoint.
  const map = config?.map
  if (!map) return map
  const { mobile, ...base } = map
  if (props.isMobile && mobile) {
    return { ...base, ...mobile }
  }
  return base
})()
</script>

<template>
  <div v-if="selectedLocation !== undefined && !isMobile" class="detail-overlay">
    <slot
      name="location-detail"
      :location="selectedLocation"
      :on-close="handleCloseLocationDetail"
    />
  </div>
  <div class="finder-panel">
    <div class="finder-panel-locations">
      <slot name="locations-header" />

      <div v-if="errorMessage" class="status-message status-message--error">
        {{ errorMessage }}
      </div>

      <div v-if="isLoading" class="loading-list">
        <MapCard v-for="n in 5" :key="n" :is-loading="true" />
      </div>

      <Teleport v-else-if="!isLoading" to="#locations-panel-mobile" :disabled="!isMobile">
        <LocationsPanel
          ref="locationsPanelRef"
          :locations="locations"
          :location-filter="locationPanelFilter"
          :location-search="locationPanelSearch"
          :location-sort="locationPanelSort"
          :user-location-state="userLocationState"
          :wait-for-user-location="waitForUserLocation"
          :hovered-id="hoveredLocationId"
          :selected-id="selectedLocationId"
          :is-mobile="isMobile"
          @select="handleSelect"
          @hover="handleHover"
          @hover-end="handleHoverEnd"
          @search-string="handleSearchChange"
          @search="handleSearchSubmit"
          @selected-filter="handleLocationFilterChange"
          @sort-option="handleLocationSortChange"
        >
          <template v-if="filters" #below-search>
            <Teleport to="#mobile-map-search-filter" :disabled="!isMobile || !chipsOnMap">
              <div class="filter-chip-bar">
                <FilterChipGroup
                  :filters="orderedChipFilters"
                  :model-value="filterValues"
                  color="white"
                  filter-button
                  :filter-button-text="t('pinboard.filters')"
                  :reset-text="t('pinboard.reset')"
                  :elevated="isMobile && chipsOnMap"
                  @update:model-value="handleApplyFilter"
                  @open-filters="allFiltersOpen = true"
                  @dropdown-close="recomputeChipOrder"
                />
              </div>
            </Teleport>
          </template>
          <template #list-header>
            <div v-if="!isMobile" class="location-list-header">
              <span>{{ locationCountLabel }}</span>
            </div>
          </template>
          <template v-if="$slots['location-card']" #location-card="{ location }">
            <slot name="location-card" :location="location" />
          </template>
        </LocationsPanel>
      </Teleport>
    </div>

    <div class="finder-panel-map">
      <MapPanel
        ref="mapPanelRef"
        :config="effectiveMapConfig"
        :is-loading="isLoading"
        :is-mobile="isMobile"
        :locations="locations"
        :geojson="geojson"
        :hovered-id="hoveredLocationId"
        :selected-id="selectedLocationId"
        :mobile-controls-target="mobileControlsTarget"
        :mobile-controls-target-left="mobileControlsTargetLeft"
        :map-content-slot="slots['map-content']"
        :on-hover="handleHover"
        :on-hover-end="handleHoverEnd"
        :on-select="handleMapSelect"
      />
      <div
        v-if="isMobile"
        ref="mobileControlsTarget"
        class="mobile-controls-float"
        :style="mobileControlsStyle"
      />
      <div
        v-if="isMobile"
        ref="mobileControlsTargetLeft"
        class="mobile-controls-float-left"
        :style="mobileControlsStyle"
      />
      <div id="mobile-map-search-filter" class="mobile-map-search-filter"></div>
    </div>

    <div v-if="filters" class="all-filters-overlay" :class="{ open: allFiltersOpen }">
      <FilterPanel
        v-if="allFiltersOpen"
        :filters="filters"
        :model-value="filterValues"
        :full-screen="isMobile"
        :title="t('pinboard.allFilters')"
        :reset-text="t('pinboard.reset')"
        @update:model-value="handleApplyFilter"
        @close="allFiltersOpen = false"
      />
    </div>
  </div>
  <BottomSheet
    ref="bottomSheetRef"
    v-model="bottomSheetOpen"
    :snap-points="snapPoints"
    :collapse-label="selectedLocation ? '' : t('pinboard.mapView')"
    :collapse-icon="selectedLocation ? undefined : IconMap"
    class="mobile-bottom-sheet"
  >
    <div class="bottom-sheet-stack">
      <div class="bottom-sheet-list-scroll" :class="{ 'is-hidden': selectedLocation }">
        <slot name="locations-header" />
        <div class="location-sheet-header">
          <span>{{ locationCountLabel }}</span>
          <div id="bottom-sheet-sort"></div>
        </div>

        <div id="locations-panel-mobile"></div>
      </div>

      <div v-if="selectedLocation" class="bottom-sheet-detail">
        <slot
          name="location-detail"
          :location="selectedLocation"
          :on-close="handleCloseLocationDetail"
        />
      </div>
    </div>
  </BottomSheet>
</template>

<style scoped>
.finder-panel {
  display: grid;
  grid-template-columns: 1fr 2fr;
  width: 100%;
  height: 100%;
  position: relative;
}

.finder-panel-locations {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ccc;
  overflow: hidden;
}

.status-message--error {
  color: var(--Schemes-Error, #b3261e);
}

.loading-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  gap: 0.75rem;
  padding: 0.5rem 1rem 1rem 1rem;
  scrollbar-width: none;
}

.finder-panel-map {
  overflow: hidden;
}

.location-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  font-family: var(--Body-Default-font-body-default-family);
  font-weight: 700;
}

/* Desktop: item count above the locations list (mirrors the mobile sheet count). */
.location-list-header {
  padding: 0.75rem 1rem 0.5rem;
  font-family: var(--Body-Default-font-body-default-family);
  font-weight: 700;
}

.mobile-bottom-sheet {
  display: none;
}

.detail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 40%;
  z-index: 10;
  background: var(--Schemes-Surface-Bright, white);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-bottom-sheet :deep(.bottom-sheet-content) {
  overflow-x: hidden;
}

.bottom-sheet-stack {
  position: relative;
  height: 100%;
  width: 100%;
  max-width: 100%;
  background: transparent;
}

.bottom-sheet-list-scroll {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}

.bottom-sheet-list-scroll::-webkit-scrollbar {
  display: none;
}

.bottom-sheet-list-scroll.is-hidden {
  visibility: hidden;
}

.bottom-sheet-detail {
  position: absolute;
  inset: 0;
  background: transparent;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 2;
}

.bottom-sheet-detail > * {
  max-width: 100%;
}

.bottom-sheet-detail :deep(img) {
  max-width: 100%;
  height: auto;
}

.filter-chip-bar {
  padding: 0.5rem 0;
}

.all-filters-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  /* Match the locations panel: the 1fr of the finder's `1fr 2fr` grid = 1/3. */
  width: calc(100% / 3);
  z-index: 12;
  background: var(--Schemes-Surface-Bright, #fff);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  display: none;
}

.all-filters-overlay.open {
  display: block;
}

/* Keep in sync with the matchMedia query in useIsMobile.ts */
@media (max-width: 768px), (max-width: 1064px) and (max-height: 600px) {
  .finder-panel {
    position: relative;
    display: block;
  }

  .finder-panel-map {
    width: 100%;
    height: 100%;
  }

  .mobile-bottom-sheet {
    display: block;
  }

  .mobile-controls-float {
    position: absolute;
    right: 10px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
    pointer-events: none;
  }

  .mobile-controls-float > :deep(*) {
    pointer-events: auto;
  }

  .mobile-controls-float-left {
    position: absolute;
    left: 10px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    pointer-events: none;
  }

  .mobile-controls-float-left > :deep(*) {
    pointer-events: auto;
  }

  .mobile-map-search-filter {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2;
    padding: 10px 0;
  }

  /* Mobile: FilterPanel renders its own full-screen takeover (teleported to
     <body>, above the header). The desktop slide-over wrapper is inert here —
     the v-if'd FilterPanel still mounts and teleports itself out. */
  .all-filters-overlay.open {
    display: none;
  }
}
</style>
