# Primary Care Finder Filter System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Figma filter system (chip row + per-chip dropdowns + "All Filters" accordion panel) as a shared, opt-in feature in `packages/ui`, with PCF filter definitions in the app and a stubbed data seam for teammate wiring.

**Architecture:** The per-chip dropdowns, the `filterButton` (sliders + active count), and the `FilterDefinition`/`FilterValues` types ship in `@phila/phila-ui-filter-chip`. We add two shared components in `packages/ui` (`FilterChipBar`, `AllFiltersPanel`), integrate them into `PinboardBody` behind an opt-in `filters` prop + `v-model:filterValues`, and wire PCF-specific `filterDefinitions` + a no-op `applyFilters` seam in the app.

**Tech Stack:** Vue 3 `<script setup>` + TS, `@phila/phila-ui-filter-chip` / `-checkbox` / `-radio`, Vite library build, pnpm workspace (link:dist), turbo.

> **Testing note:** This repo has **no test runner** (no vitest/jest anywhere). Per YAGNI + matching repo patterns, this plan does NOT introduce one. Verification gates are the repo's real ones: `type-check`, `lint`, `build`, plus manual `pnpm dev:pc` (Andy runs dev servers — the implementing agent must NOT start them). Each task ends with the applicable gate.

> **Build dependency:** `apps/*` consume `@pinboard/ui` from its **`dist/`** (link: resolves to built output). After any change in `packages/ui`, run `pnpm --filter @pinboard/ui build` before the app will see it.

---

## File Structure

**Create:**
- `packages/ui/src/components/FilterChipBar.vue` — chip row wrapper (FilterChipGroup + filterButton; emits open-filters).
- `packages/ui/src/components/AllFiltersPanel.vue` — accordion mega-panel (search + sections + Reset/Apply).

**Modify:**
- `packages/ui/package.json` — add `@phila/phila-ui-filter-chip`, `@phila/phila-ui-checkbox` deps.
- `packages/ui/src/index.ts` — re-export `FilterDefinition`, `FilterValues`, `FilterChoice`.
- `packages/ui/src/components/PinboardBody.vue` — opt-in `filters` prop, `v-model:filterValues`, render bar + panel, mobile teleport.
- `apps/primary-care-finder/frontend/src/App.vue` — replace slot chips with prop-driven filters + `applyFilters` seam.
- `apps/primary-care-finder/frontend/package.json` — drop direct `@phila/phila-ui-filter-chip` dep (now transitive via `@pinboard/ui`).

---

## Task 1: Add deps + re-export filter types in `packages/ui`

**Files:**
- Modify: `packages/ui/package.json`
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Add the two dependencies** to `packages/ui/package.json` `dependencies` (alphabetical, beside the other `@phila/phila-ui-*` entries). `@phila/phila-ui-radio` is already present.

```jsonc
"@phila/phila-ui-cards": "0.2.0-beta.5",
"@phila/phila-ui-checkbox": "0.1.1-beta.4",
"@phila/phila-ui-core": "2.4.0-beta.2",
"@phila/phila-ui-filter-chip": "0.2.0-beta.0",
"@phila/phila-ui-map-core": "1.1.0-beta.12",
```

- [ ] **Step 2: Install** from repo root.

Run: `pnpm install`
Expected: completes; lockfile updated. Pre-existing peer warnings (vue-router 4 vs 5, typescript) are unrelated.

- [ ] **Step 3: Re-export the filter types** — append to `packages/ui/src/index.ts`:

```ts
export type {
  FilterDefinition,
  FilterValues,
  FilterChoice,
} from '@phila/phila-ui-filter-chip'
```

- [ ] **Step 4: Type-check.**

Run: `pnpm --filter @pinboard/ui type-check`
Expected: PASS (no errors).

- [ ] **Step 5: Commit.**

```bash
git add packages/ui/package.json packages/ui/src/index.ts pnpm-lock.yaml
git commit -m "feat(ui): add filter-chip/checkbox deps and re-export filter types"
```

---

## Task 2: `FilterChipBar.vue` (chip row wrapper)

Thin wrapper over `FilterChipGroup`: leading filter button + one chip per dimension, drag-scroll (built into the package). Owns nothing; passes `filterValues` through and bubbles `open-filters`.

**Files:**
- Create: `packages/ui/src/components/FilterChipBar.vue`

- [ ] **Step 1: Create the component.**

```vue
<script setup lang="ts">
import { FilterChipGroup } from '@phila/phila-ui-filter-chip'
import '@phila/phila-ui-filter-chip/dist/index.css'
import type { FilterDefinition, FilterValues } from '@phila/phila-ui-filter-chip'

const props = defineProps<{
  filters: FilterDefinition[]
  modelValue: FilterValues
}>()

const emit = defineEmits<{
  'update:modelValue': [value: FilterValues]
  'open-filters': []
}>()

function onUpdate(value: FilterValues) {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="filter-chip-bar">
    <FilterChipGroup
      :filters="props.filters"
      :model-value="props.modelValue"
      filter-button
      @update:model-value="onUpdate"
      @open-filters="emit('open-filters')"
    />
  </div>
</template>

<style scoped>
.filter-chip-bar {
  padding: 0.5rem 1rem;
}
</style>
```

- [ ] **Step 2: Type-check.**

Run: `pnpm --filter @pinboard/ui type-check`
Expected: PASS.

- [ ] **Step 3: Commit.**

```bash
git add packages/ui/src/components/FilterChipBar.vue
git commit -m "feat(ui): add FilterChipBar wrapper over FilterChipGroup"
```

---

## Task 3: `AllFiltersPanel.vue` (accordion mega-panel)

Opened by the filter button. Holds a **draft** copy of `filterValues`; commits on **Apply**, clears on **Reset**, discards on **close (X)**. One collapsible section per filter (`CheckboxGroup` for `multiple`, else `RadioGroup`). Includes a search box (filters which sections/choices are visible by label text) and an Apply(n) count.

**Files:**
- Create: `packages/ui/src/components/AllFiltersPanel.vue`

- [ ] **Step 1: Create the component.**

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search } from '@phila/phila-ui-search'
import { Button } from '@phila/phila-ui-button'
import { CheckboxGroup } from '@phila/phila-ui-checkbox'
import { RadioGroup } from '@phila/phila-ui-radio'
import { faChevronDown, faXmark } from '@fortawesome/pro-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import type { FilterDefinition, FilterValues } from '@phila/phila-ui-filter-chip'

const props = defineProps<{
  open: boolean
  filters: FilterDefinition[]
  modelValue: FilterValues
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:modelValue': [value: FilterValues]
}>()

// Draft state: edits stay local until Apply.
const draft = ref<FilterValues>({})
const search = ref('')
const collapsed = ref<Record<string, boolean>>({})

// Re-seed the draft each time the panel opens.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      draft.value = structuredClone(props.modelValue)
      search.value = ''
    }
  }
)

// Sections are checkbox/radio filters only (skip toggle-only filters with no choices).
const sections = computed(() =>
  props.filters.filter((f) => Array.isArray(f.choices) && f.choices.length > 0)
)

const visibleSections = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return sections.value
  return sections.value.filter(
    (f) =>
      f.label.toLowerCase().includes(q) ||
      (f.choices ?? []).some((c) => c.text.toLowerCase().includes(q))
  )
})

const activeCount = computed(() =>
  sections.value.reduce((n, f) => {
    if (f.excludeFromCount) return n
    const v = draft.value[f.key]
    return n + (Array.isArray(v) ? v.length : v ? 1 : 0)
  }, 0)
)

function checkboxModel(key: string): Array<string | number | boolean> {
  const v = draft.value[key]
  return Array.isArray(v) ? v : []
}
function setCheckbox(key: string, value: Array<string | number | boolean>) {
  draft.value = { ...draft.value, [key]: value as string[] }
}
function radioModel(key: string): string {
  const v = draft.value[key]
  return typeof v === 'string' ? v : ''
}
function setRadio(key: string, value: string) {
  draft.value = { ...draft.value, [key]: value }
}

function toggleSection(key: string) {
  collapsed.value = { ...collapsed.value, [key]: !collapsed.value[key] }
}
function close() {
  emit('update:open', false)
}
function reset() {
  draft.value = {}
}
function apply() {
  emit('update:modelValue', structuredClone(draft.value))
  close()
}
</script>

<template>
  <div v-if="props.open" class="all-filters-panel">
    <header class="all-filters-header">
      <h2>All Filters</h2>
      <button class="icon-button" aria-label="Close filters" @click="close">
        <FontAwesomeIcon :icon="faXmark" />
      </button>
    </header>

    <Search v-model="search" placeholder="Search" />

    <div class="all-filters-sections">
      <section v-for="f in visibleSections" :key="f.key" class="filter-section">
        <button class="section-toggle" @click="toggleSection(f.key)">
          <span>{{ f.label }}</span>
          <FontAwesomeIcon
            :icon="faChevronDown"
            :class="{ collapsed: collapsed[f.key] }"
          />
        </button>
        <div v-show="!collapsed[f.key]" class="section-body">
          <CheckboxGroup
            v-if="f.multiple"
            :group-label="f.label"
            :choices="f.choices ?? []"
            :model-value="checkboxModel(f.key)"
            @update:model-value="(v) => setCheckbox(f.key, v)"
          />
          <RadioGroup
            v-else
            :group-label="f.label"
            :choices="f.choices ?? []"
            :model-value="radioModel(f.key)"
            @update:model-value="(v) => setRadio(f.key, v)"
          />
        </div>
      </section>
    </div>

    <footer class="all-filters-footer">
      <Button color="secondary" @click="reset">Reset</Button>
      <Button color="primary" @click="apply">
        Apply{{ activeCount ? ` (${activeCount})` : '' }}
      </Button>
    </footer>
  </div>
</template>

<style scoped>
.all-filters-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  height: 100%;
  background: #fff;
  overflow-y: auto;
}
.all-filters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
}
.all-filters-sections {
  display: flex;
  flex-direction: column;
}
.filter-section {
  border-bottom: 1px solid #ccc;
  padding: 0.75rem 0;
}
.section-toggle {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 700;
  font-family: var(--Body-Default-font-body-default-family);
}
.section-toggle .collapsed {
  transform: rotate(-90deg);
}
.section-body {
  padding-top: 0.75rem;
}
.all-filters-footer {
  display: flex;
  gap: 0.75rem;
  margin-top: auto;
}
.all-filters-footer > * {
  flex: 1;
}
</style>
```

> Note: `Button`/`Search`/`CheckboxGroup`/`RadioGroup` prop names are taken from their `dist/*.d.ts`. If `Button`'s `color` enum differs at build time, the type-check in Step 2 will surface it — adjust to the reported allowed values. Exact spacing/typography is visually refined during manual verification (Task 6).

- [ ] **Step 2: Type-check.**

Run: `pnpm --filter @pinboard/ui type-check`
Expected: PASS. (If `Button` color value is rejected, set it to the allowed primary/secondary token the error names, then re-run.)

- [ ] **Step 3: Commit.**

```bash
git add packages/ui/src/components/AllFiltersPanel.vue
git commit -m "feat(ui): add AllFiltersPanel accordion with draft/apply/reset"
```

---

## Task 4: Integrate into `PinboardBody.vue`

Add the opt-in `filters` prop + `v-model:filterValues`, render `FilterChipBar` (desktop header + mobile teleport) and host `AllFiltersPanel`. Absent `filters` ⇒ nothing new renders.

**Files:**
- Modify: `packages/ui/src/components/PinboardBody.vue`

- [ ] **Step 1: Add imports** below the existing pinboard component imports (after line 22, `import SearchSuggestions ...`).

```ts
import FilterChipBar from './FilterChipBar.vue'
import AllFiltersPanel from './AllFiltersPanel.vue'
import type { FilterDefinition, FilterValues } from '@phila/phila-ui-filter-chip'
```

- [ ] **Step 2: Extend `defineProps`** — add three optional props to the existing props object (after `isMobile: boolean`):

```ts
  filters?: FilterDefinition[]
  filterValues?: FilterValues
  mobileFilterPlacement?: 'map' | 'sheet'
```

- [ ] **Step 3: Extend `defineEmits`** — add to the existing emits:

```ts
  'update:filterValues': [value: FilterValues]
```

- [ ] **Step 4: Add panel open-state + helpers** in `<script setup>` (near the other refs):

```ts
const allFiltersOpen = ref(false)
const filterPlacement = computed(() => props.mobileFilterPlacement ?? 'map')

function onFilterValues(value: FilterValues) {
  emit('update:filterValues', value)
}
```

- [ ] **Step 5: Add mobile teleport targets.** Inside `.mobile-map-search-filter` (after the `<Search>` block, near line 387) add the map target; and at the top of `.bottom-sheet-list-scroll` (just inside it, before the existing `locations-header` slot at line 418) add the sheet target:

In `.mobile-map-search-filter` (after `<Search>`):
```vue
        <div ref="mobileFilterMapTarget" class="mobile-filter-target"></div>
```

At the top of `.bottom-sheet-list-scroll` (before `<slot name="locations-header" />` on line 418):
```vue
        <div ref="mobileFilterSheetTarget" class="mobile-filter-target"></div>
```

And declare the refs in `<script setup>`:
```ts
const mobileFilterMapTarget = ref<HTMLDivElement | null>(null)
const mobileFilterSheetTarget = ref<HTMLDivElement | null>(null)
const mobileFilterTarget = computed(() =>
  filterPlacement.value === 'sheet'
    ? mobileFilterSheetTarget.value
    : mobileFilterMapTarget.value
)
```

- [ ] **Step 6: Render the bar (desktop) + the teleported bar (mobile) + the panel.**

Desktop: in `.finder-panel-locations`, immediately before the existing `<slot name="locations-header" />` (line 311):
```vue
      <FilterChipBar
        v-if="filters && !isMobile"
        :filters="filters"
        :model-value="filterValues ?? {}"
        @update:model-value="onFilterValues"
        @open-filters="allFiltersOpen = true"
      />
```

Mobile: anywhere inside the root template (e.g. just before the closing of the `.finder-panel` map section), teleport into the chosen target:
```vue
      <Teleport v-if="filters && isMobile && mobileFilterTarget" :to="mobileFilterTarget">
        <FilterChipBar
          :filters="filters"
          :model-value="filterValues ?? {}"
          @update:model-value="onFilterValues"
          @open-filters="allFiltersOpen = true"
        />
      </Teleport>
```

Panel host: render once near the end of the template (before `</template>`), as an overlay on the locations panel:
```vue
  <div v-if="filters" class="all-filters-overlay" :class="{ open: allFiltersOpen }">
    <AllFiltersPanel
      v-model:open="allFiltersOpen"
      :filters="filters"
      :model-value="filterValues ?? {}"
      @update:model-value="onFilterValues"
    />
  </div>
```

- [ ] **Step 7: Add overlay + target styles** to the scoped `<style>`:

```css
.mobile-filter-target {
  width: 100%;
}
.all-filters-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 40%;
  z-index: 12;
  background: #fff;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  display: none;
}
.all-filters-overlay.open {
  display: block;
}
@media (max-width: 1064px) {
  .all-filters-overlay {
    width: 100%;
  }
}
```

- [ ] **Step 8: Type-check + build `packages/ui`.**

Run: `pnpm --filter @pinboard/ui type-check`
Expected: PASS.
Run: `pnpm --filter @pinboard/ui build`
Expected: build succeeds; `packages/ui/dist` updated.

- [ ] **Step 9: Commit.**

```bash
git add packages/ui/src/components/PinboardBody.vue
git commit -m "feat(ui): opt-in filter bar + All Filters panel in PinboardBody"
```

---

## Task 5: Wire PCF filter definitions + data seam in the app

Replace the slot-based `FilterChipGroup` (the relocated WIP) with prop-driven filters; add PCF `filterDefinitions` and a no-op `applyFilters` seam for the teammate.

**Files:**
- Modify: `apps/primary-care-finder/frontend/src/App.vue`
- Modify: `apps/primary-care-finder/frontend/package.json`

- [ ] **Step 1: Replace the filter logic in `<script setup>`.** Remove the previous `FilterChipGroup` import, `serviceFilters`, `offersService`, and the `filterValues`/`filteredLocations` blocks added in the WIP relocation. Replace the imports/types area and filter logic with:

```ts
import { faArrowUpArrowDown } from '@fortawesome/pro-solid-svg-icons'
import type { FilterDefinition, FilterValues } from '@pinboard/ui'

const filterValues = ref<FilterValues>({})

const filterDefinitions: FilterDefinition[] = [
  {
    key: 'sort',
    label: 'Sort',
    multiple: false,
    excludeFromCount: true,
    iconDefinition: faArrowUpArrowDown,
    // TODO(teammate): finalize sort options + ordering logic.
    choices: [
      { text: 'Distance', value: 'distance' },
      { text: 'Name (A–Z)', value: 'name' },
    ],
  },
  {
    key: 'ageGroup',
    label: 'Age Group',
    multiple: true,
    choices: [
      { text: 'Adult', value: 'adult' },
      { text: 'Children', value: 'children' },
    ],
  },
  {
    key: 'waitTime',
    label: 'Wait time (Primary Care)',
    multiple: true,
    choices: [
      { text: 'Same day or walk in', value: 'sameDay' },
      { text: '<1 week (well visit)', value: 'weekWell' },
      { text: '<1 week (sick visit)', value: 'weekSick' },
      { text: '<2 months (all primary care)', value: 'twoMonths' },
    ],
  },
  {
    key: 'speciality',
    label: 'Speciality services',
    multiple: true,
    choices: [
      { text: 'Mental health', value: 'mental' },
      { text: 'Dental', value: 'dental' },
      { text: 'Eye care', value: 'eye' },
      { text: 'Podiatry', value: 'podiatry' },
      { text: 'MAT', value: 'mat' },
      { text: 'Nutrition', value: 'nutrition' },
      { text: 'Tobacco cessation', value: 'tobacco' },
      { text: 'Pharmacy', value: 'pharmacy' },
    ],
  },
  {
    key: 'tests',
    label: 'Tests and imaging',
    multiple: true,
    choices: [
      { text: 'Blood', value: 'blood' },
      { text: 'STI', value: 'sti' },
      { text: 'COVID', value: 'covid' },
      { text: 'Mammography', value: 'mammo' },
      { text: 'X-ray', value: 'xray' },
    ],
  },
  {
    key: 'languages',
    label: 'Languages spoken by staff',
    multiple: true,
    // TODO(teammate): replace with real `language` field values.
    choices: [
      { text: 'Spanish', value: 'spanish' },
      { text: 'Mandarin', value: 'mandarin' },
      { text: 'Vietnamese', value: 'vietnamese' },
    ],
  },
]

// SEAM: data wiring belongs to the teammate. Returns locations unfiltered for now.
// TODO(teammate): map filterValues → PrimaryCareProperties predicates.
//   ageGroup   → *_ad / *_ch suffixed fields
//   waitTime   → wait_* fields
//   speciality → special_* fields
//   tests      → tests_* fields
//   languages  → language field
//   sort       → ordering (apply after filtering; not a predicate)
function applyFilters(
  locations: PrimaryCareLocation[],
  _values: FilterValues
): PrimaryCareLocation[] {
  return locations
}
```

- [ ] **Step 2: Update `filteredLocations`** to run the seam then keep the existing free-text search:

```ts
const filteredLocations = computed<PrimaryCareLocation[]>(() => {
  let result = applyFilters(locationsWithDistance.value, filterValues.value)

  if (searchString.value) {
    const terms = searchString.value
      .replace(/\W+/g, ' ')
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
    result = result.filter((loc) => {
      const haystack = JSON.stringify(Object.values(loc)).toLowerCase()
      return terms.some((term) => haystack.includes(term))
    })
  }

  return result
})
```

- [ ] **Step 3: Replace the template usage.** Remove the `#locations-header` template block that held `<FilterChipGroup>`. Add the two bindings to `<PinboardBody …>` (alongside the existing props, e.g. after `:is-mobile="isMobile"`):

```vue
      :filters="filterDefinitions"
      v-model:filter-values="filterValues"
```

- [ ] **Step 4: Drop the now-transitive dep** from `apps/primary-care-finder/frontend/package.json` — remove the `"@phila/phila-ui-filter-chip": "0.2.0-beta.0",` line (types now come from `@pinboard/ui`). Keep `@fortawesome/*` deps (used for the Sort icon).

- [ ] **Step 5: Install (lockfile) then type-check the app.** `@pinboard/ui` was built in Task 4 Step 8.

Run: `pnpm install`
Expected: completes.
Run: `pnpm --filter @pinboard/primary-care-finder type-check`
Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add apps/primary-care-finder/frontend/src/App.vue apps/primary-care-finder/frontend/package.json pnpm-lock.yaml
git commit -m "feat(primary-care): use shared filter bar + stub applyFilters seam"
```

---

## Task 6: Full build, lint, and manual verification

**Files:** none (verification only)

- [ ] **Step 1: Lint changed packages.**

Run: `pnpm --filter @pinboard/ui lint && pnpm --filter @pinboard/primary-care-finder lint`
Expected: PASS (fix any reported issues; match prettier rules — no semicolons, single quotes, 2-space indent, 100-char width in this app).

- [ ] **Step 2: Full build.**

Run: `pnpm build`
Expected: turbo builds all packages/apps successfully.

- [ ] **Step 3: Manual verification (Andy runs dev — do NOT start it yourself).**

Hand off this checklist to Andy to run `pnpm dev:pc` and confirm against Figma:
- Desktop: chip row under the search in the card panel — filter button + Sort/Age Group/Wait time/Speciality services/Tests and imaging/Languages chips.
- Clicking a chip opens its dropdown (radio for Sort, checkboxes otherwise) with Reset/Apply.
- Clicking the filter button opens the All Filters panel: search, accordion sections, Reset/Apply(n); Apply updates the chip counts; Reset clears.
- Mobile: chip bar appears under the search on the map (default `mobileFilterPlacement="map"`); flipping the prop to `"sheet"` moves it to the top of the bottom sheet.
- Selecting filters does NOT change the list yet (seam is a no-op) — expected until teammate wires data.

- [ ] **Step 4: Final commit (if lint produced fixes).**

```bash
git add -A
git commit -m "chore: lint fixes for filter system"
```

---

## Self-Review

- **Spec coverage:** FilterChipBar (Task 2), AllFiltersPanel (Task 3), PinboardBody opt-in + v-model + mobile teleport placement prop (Task 4), app filterDefinitions for all six dimensions + applyFilters seam (Task 5), shared placement in packages/ui + opt-out via absent `filters` (Task 4 conditionals), type re-exports (Task 1), deps (Tasks 1 & 5). All spec sections covered.
- **Placeholders:** The only `TODO`s are the intentional, spec-defined teammate seam markers (Sort options, Languages list, applyFilters predicates) — explicit by design, not plan gaps.
- **Type consistency:** `FilterDefinition`/`FilterValues`/`FilterChoice` used consistently from `@phila/phila-ui-filter-chip` (in packages/ui) and re-exported via `@pinboard/ui` (in the app). `update:filterValues` emit ↔ `v-model:filter-values` binding match. `mobileFilterPlacement` values `'map'|'sheet'` consistent across prop, computed, and verification.
- **Build ordering:** packages/ui is built (Task 4) before the app type-checks/builds (Tasks 5–6), matching the link:dist consumption model.
