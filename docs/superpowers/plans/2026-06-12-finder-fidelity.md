# Finder Fidelity (F1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the philly-311 finder up to the Figma landing design (icon filter chips, faithful report-listing cards, panel header alignment, trending UI removed) via a new `location-card` slot in `@pinboard/ui`.

**Architecture:** One deliberate shared-package change — `LocationsPanel` renders a `location-card` scoped slot inside its existing per-location wrapper (MapCard stays the default), forwarded through `PinboardBody` at both render sites. philly-311 then supplies a pixel-faithful `ReportListingCard` and replaces the built-in filter chips with an app-level `FilterChips` row in the `locations-header` slot.

**Tech Stack:** Vue 3 `<script setup>` + TypeScript; pnpm monorepo (`packages/ui` = `@pinboard/ui`, consumed by apps **via dist** — rebuild after every packages/ui change); vitest + @vue/test-utils (jsdom); FontAwesome pro-solid; `@phila/phila-ui-tags` (`Tags` single-tag component, `TagsProps`).

**Spec:** `docs/superpowers/specs/2026-06-12-finder-fidelity-design.md` — read it first. Design source: Figma section 9789:30329 (card node 9789:29931).

**Branch:** `311-slice-f1-finder-fidelity` (already created off `311-staging`). Repo root for git: `/Users/darren.mcdowell/Projects/pinboard-3`.

**Commands cheat-sheet:**
- philly-311 (run from `apps/philly-311/frontend`): `npm run test:run`, `npm run type-check`, `npm run lint`
- packages/ui (run from `packages/ui`): `npm run test:run` (added in Task 1), `npm run type-check`, `npm run lint`, `npm run build`
- **After ANY packages/ui source change, run `npm run build` in `packages/ui` before running app tests or dev servers** — apps resolve `@pinboard/ui` from `dist/`.
- Installing new dev-deps needs the FontAwesome token inline:
  `cd /Users/darren.mcdowell/Projects/pinboard-3 && NPM_FONTAWESOME_SECRET=54AC7138-FFDC-4F82-BD32-332A9F91091A pnpm install`

**Conventions that bite:**
- Every code file starts with `ABOUTME:` comment lines.
- packages/ui script style: section comments (`// props`, `// emits`, `// event handlers`) — match them.
- philly-311 style: BEM-ish scoped CSS with `var(--ui-color-*/--spacing-*, fallback)`.
- TDD strictly: failing test first, run it, implement, run again. Pristine output.

---

### Task 1: `@pinboard/ui` — test infrastructure + `location-card` slot

**Files:**
- Modify: `packages/ui/package.json` (test deps + scripts)
- Create: `packages/ui/vitest.config.ts`
- Create: `packages/ui/src/components/LocationsPanel.test.ts`
- Modify: `packages/ui/src/components/LocationsPanel.vue`
- Modify: `packages/ui/src/components/PinboardBody.vue` (slot forwarding ×2 + defineSlots typing)
- Modify: `packages/ui/src/types.ts:67` (`locationCardInfo` → optional)

- [ ] **Step 1: Verify the dead prop is unreferenced**

Run: `grep -rn --exclude-dir={node_modules,dist,.vite} "locationCardSlot" /Users/darren.mcdowell/Projects/pinboard-3/apps /Users/darren.mcdowell/Projects/pinboard-3/packages`
Expected: hits ONLY in `packages/ui/src/components/LocationsPanel.vue` (the dead prop declaration). Built bundles under `dist/` don't count. If any app SOURCE references it, STOP and report.

- [ ] **Step 2: Add test infrastructure**

In `packages/ui/package.json`: add to `scripts`: `"test": "vitest", "test:run": "vitest run"`; add to `devDependencies` (versions copied from `apps/philly-311/frontend/package.json`): `"vitest": "^4.1.5", "@vue/test-utils": "^2.4.9", "jsdom": "^29.1.0"`.

Create `packages/ui/vitest.config.ts`:

```ts
// ABOUTME: Vitest config for @pinboard/ui — jsdom env + Vue SFC plugin.
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
  },
})
```

Run: `cd /Users/darren.mcdowell/Projects/pinboard-3 && NPM_FONTAWESOME_SECRET=54AC7138-FFDC-4F82-BD32-332A9F91091A pnpm install`
Expected: clean install.

- [ ] **Step 3: Write the failing tests**

Create `packages/ui/src/components/LocationsPanel.test.ts`:

```ts
// ABOUTME: Tests for LocationsPanel — default MapCard rendering vs the location-card
// ABOUTME: slot, and wrapper behavior (events, classes, data attrs) parity in both branches.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LocationsPanel from './LocationsPanel.vue'
import type { BasicLocation } from '../types'

const MapCardStub = {
  name: 'MapCard',
  props: ['heading', 'subheader'],
  template: '<div class="mapcard-stub">{{ heading }}</div>',
}

function locations(): BasicLocation[] {
  return [
    {
      id: 'a1',
      name: 'Pothole Repair',
      latitude: 39.95,
      longitude: -75.16,
      locationCardInfo: { heading: 'Pothole Repair', subheader: '1234 Market St' },
    },
    {
      id: 'b2',
      name: 'Graffiti Removal',
      latitude: 39.96,
      longitude: -75.17,
      locationCardInfo: { heading: 'Graffiti Removal', subheader: '5 N Broad St' },
    },
  ]
}

function mountDefault(extra: Record<string, unknown> = {}) {
  return mount(LocationsPanel, {
    props: { locations: locations(), ...extra },
    global: { stubs: { MapCard: MapCardStub } },
  })
}

function mountWithSlot(extra: Record<string, unknown> = {}) {
  return mount(LocationsPanel, {
    props: { locations: locations(), ...extra },
    slots: {
      'location-card': `<template #location-card="{ location }">
        <span class="custom-card">{{ location.name }}</span>
      </template>`,
    },
    global: { stubs: { MapCard: MapCardStub } },
  })
}

describe('LocationsPanel - default branch (no slot)', () => {
  it('renders a MapCard per location with locationCardInfo applied', () => {
    const w = mountDefault()
    const cards = w.findAll('.mapcard-stub')
    expect(cards).toHaveLength(2)
    expect(cards[0].text()).toBe('Pothole Repair')
  })

  it('keeps wrapper behavior: data-location-id, click → select, hover events', async () => {
    const w = mountDefault()
    const first = w.find('[data-location-id="a1"]')
    expect(first.exists()).toBe(true)
    await first.trigger('click')
    expect(w.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'a1' })
    await first.trigger('mouseenter')
    expect(w.emitted('hover')?.[0]).toEqual(['a1'])
    await first.trigger('mouseleave')
    expect(w.emitted('hover-end')).toBeTruthy()
  })

  it('applies hovered/selected classes from props', () => {
    const w = mountDefault({ hoveredId: 'a1', selectedId: 'b2' })
    expect(w.find('[data-location-id="a1"]').classes()).toContain('location-card--hovered')
    expect(w.find('[data-location-id="b2"]').classes()).toContain('location-card--selected')
  })
})

describe('LocationsPanel - location-card slot branch', () => {
  it('renders the slot content with the location, and no MapCard', () => {
    const w = mountWithSlot()
    const custom = w.findAll('.custom-card')
    expect(custom).toHaveLength(2)
    expect(custom[0].text()).toBe('Pothole Repair')
    expect(w.find('.mapcard-stub').exists()).toBe(false)
  })

  it('keeps identical wrapper behavior: data attr, tabindex, click, hover, classes', async () => {
    const w = mountWithSlot({ hoveredId: 'a1', selectedId: 'b2' })
    const first = w.find('[data-location-id="a1"]')
    expect(first.exists()).toBe(true)
    expect(first.attributes('tabindex')).toBe('0')
    expect(first.classes()).toContain('location-card')
    expect(first.classes()).toContain('location-card--hovered')
    expect(w.find('[data-location-id="b2"]').classes()).toContain('location-card--selected')
    await first.trigger('click')
    expect(w.emitted('select')?.[0]?.[0]).toMatchObject({ id: 'a1' })
    await first.trigger('mouseenter')
    expect(w.emitted('hover')?.[0]).toEqual(['a1'])
  })

  it('selects via Enter keydown+keyup like the default branch', async () => {
    const w = mountWithSlot()
    const first = w.find('[data-location-id="a1"]')
    await first.trigger('keydown', { key: 'Enter' })
    await first.trigger('keyup', { key: 'Enter' })
    expect(w.emitted('select')).toHaveLength(1)
  })
})
```

- [ ] **Step 4: Run to verify they fail**

Run: `cd /Users/darren.mcdowell/Projects/pinboard-3/packages/ui && npm run test:run`
Expected: slot-branch tests FAIL (slot not rendered — MapCard renders instead, `.custom-card` absent). Default-branch tests should mostly pass already.

- [ ] **Step 5: Implement the slot in LocationsPanel**

In `packages/ui/src/components/LocationsPanel.vue`:

1. Script changes — imports become `import { computed, ref, useSlots, watch } from 'vue'`; **delete the dead `locationCardSlot` prop** (lines ~27-31); add under `// component variables`:

```ts
const slots = useSlots()
```

add under `// computed refs`:

```ts
const hasCardSlot = computed(() => !!slots['location-card'])
```

add under `// utility functions` (single source of wrapper bindings for BOTH branches):

```ts
function cardBindings(location: BasicLocation) {
  return {
    'data-location-id': location.id,
    class: [
      'location-card',
      {
        'location-card--hovered': props.hoveredId === location.id,
        'location-card--selected': props.selectedId === location.id,
      },
    ],
    tabindex: 0,
    onClick: () => emit('select', location),
    onMouseenter: () => emit('hover', location.id),
    onMouseleave: () => emit('hover-end'),
    onKeydown: (e: KeyboardEvent) => {
      if (e.key === 'Enter') pendingKeydown.value = true
    },
    onKeyup: (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleCardKeyup(location)
    },
  }
}
```

(`const props = defineProps<{...}>()` already exists at line 19 — no change needed there.)

2. Template — replace the `.location-list` block:

```vue
  <div ref="listRef" class="location-list content">
    <template v-if="hasCardSlot">
      <div v-for="location in locations" :key="location.id" v-bind="cardBindings(location)">
        <slot name="location-card" :location="location" />
      </div>
    </template>
    <template v-else>
      <MapCard
        v-for="location in locations"
        :key="location.id"
        v-bind="{ ...location.locationCardInfo, ...cardBindings(location) }"
      />
      <!-- cardBindings spread LAST so card-info keys can never clobber wrapper
           bindings (class/handlers); MapCardProps keys are disjoint anyway. -->
    </template>
  </div>
```

(The MapCard branch keeps byte-identical behavior — same bindings, now sourced from `cardBindings` so the branches cannot drift.)

3. `packages/ui/src/types.ts:67`: `locationCardInfo: MapCardProps` → `locationCardInfo?: MapCardProps`.

- [ ] **Step 6: Run packages/ui tests to verify they pass**

Run: `npm run test:run` (in `packages/ui`)
Expected: all PASS.

- [ ] **Step 7: Forward the slot through PinboardBody**

In `packages/ui/src/components/PinboardBody.vue`:

1. Find the slots type declaration near the `// slots` comment (line ~45). If it uses `defineSlots`, add:

```ts
'location-card'?: (props: { location: BasicLocation }) => unknown
```

(`BasicLocation` is already imported or import it from `../types`.)

2. At BOTH `<LocationsPanel ...>` sites (desktop ~line 332, mobile ~line 443), add as child content:

```vue
        <template v-if="slots['location-card']" #location-card="scope">
          <slot name="location-card" v-bind="scope" />
        </template>
```

(`const slots = useSlots()` already exists at line ~96.)

- [ ] **Step 8: Build + verify the whole package**

Run (in `packages/ui`): `npm run test:run && npm run type-check && npm run lint && npm run build`
Expected: all green; dist rebuilt.

- [ ] **Step 9: Commit**

```bash
git -C /Users/darren.mcdowell/Projects/pinboard-3 add packages/ui pnpm-lock.yaml
git -C /Users/darren.mcdowell/Projects/pinboard-3 commit -m "feat(ui): location-card slot on LocationsPanel/PinboardBody; vitest infra for packages/ui"
```

---

### Task 2: Primary-care-finder weather eye (verification only — Darren flagged this explicitly)

This task changes no code. The Task 1 slot ACTIVATES primary-care-finder's previously-ignored `#location-card` template (`apps/primary-care-finder/frontend/src/App.vue:115`, rendering its `components/LocationCard.vue` — a plain presentational div, so double-handling is not expected). It has NO test suite (verified) — so: type-check + real render.

- [ ] **Step 1: Type-check primary-care-finder**

Run: `cd /Users/darren.mcdowell/Projects/pinboard-3/apps/primary-care-finder/frontend && npm run type-check` (check its package.json scripts; use the closest equivalent, e.g. `vue-tsc`)
Expected: clean (same as before the change — if it was already failing pre-change, note that, don't fix unrelated breakage).

- [ ] **Step 2: Render check, before/after comparison**

Run its dev server (`npm run dev` in that app, background). In a browser (Playwright MCP): load it, confirm (a) the left-panel list now renders LocationCard content (site name bold, address, phone) instead of MapCard headings, (b) clicking a list card still opens the detail view, (c) hover still highlights, (d) no new console errors. Take a screenshot for the report. Kill the dev server.

**If the list renders broken or interaction regressed: STOP. Report to the controller — this goes to Darren before proceeding.** Otherwise record "primary-care: activated as intended" with the screenshot path.

No commit (nothing changed).

---

### Task 3: philly-311 — `formatCardTimestamp` + `ReportListingCard`

**Files:**
- Create: `apps/philly-311/frontend/src/utils/datetime.ts`
- Create: `apps/philly-311/frontend/src/utils/datetime.test.ts`
- Create: `apps/philly-311/frontend/src/components/ReportListingCard.vue`
- Create: `apps/philly-311/frontend/src/components/ReportListingCard.test.ts`

All commands in `apps/philly-311/frontend`.

- [ ] **Step 1: Write the failing util test**

Create `src/utils/datetime.test.ts`:

```ts
// ABOUTME: Tests for formatCardTimestamp — report-card date line formatting.
import { describe, it, expect } from 'vitest'
import { formatCardTimestamp } from './datetime'

describe('formatCardTimestamp', () => {
  it('formats an ISO timestamp as M/D/YY · h:mm AM', () => {
    // Built from local-time components so the assertion is timezone-stable.
    const iso = new Date(2026, 9, 10, 10, 41).toISOString()
    expect(formatCardTimestamp(iso)).toBe('10/10/26 · 10:41 AM')
  })

  it('handles PM and single-digit month/day', () => {
    const iso = new Date(2026, 0, 5, 15, 5).toISOString()
    expect(formatCardTimestamp(iso)).toBe('1/5/26 · 3:05 PM')
  })

  it('returns null for missing or invalid input', () => {
    expect(formatCardTimestamp(undefined)).toBeNull()
    expect(formatCardTimestamp(null)).toBeNull()
    expect(formatCardTimestamp('not-a-date')).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:run -- src/utils/datetime.test.ts`
Expected: FAIL — cannot resolve `./datetime`.

- [ ] **Step 3: Implement**

Create `src/utils/datetime.ts`:

```ts
// ABOUTME: Format an ISO timestamp as the report-card date line, e.g. "10/10/26 · 10:41 AM".
// ABOUTME: Returns null for missing/invalid input so callers can skip the row.

export function formatCardTimestamp(iso: string | undefined | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const date = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${date} · ${time}`
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:run -- src/utils/datetime.test.ts` → PASS.

- [ ] **Step 5: Write the failing card tests**

Create `src/components/ReportListingCard.test.ts`:

```ts
// ABOUTME: Tests for ReportListingCard — Figma .311 Report listing fidelity:
// ABOUTME: photo/placeholder, status tag, icon+title, address, date line, dot, distance.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ReportListingCard from './ReportListingCard.vue'
import type { Report } from '@/composables/useNearbyReports'

const TagsStub = {
  name: 'Tags',
  props: ['text', 'color'],
  template: '<span class="tag-stub" :data-color="color">{{ text }}</span>',
}

function report(overrides: Partial<Report> = {}): Report {
  return {
    id: 'a1',
    caseNumber: 'a1',
    lat: 39.95,
    lng: -75.16,
    serviceType: 'Pothole Repair',
    status: 'In Progress',
    address: '1234 Market St',
    // 161 m ≈ 0.10006 mi — just over the feet/miles boundary in formatDistance.
    distance: 161,
    mediaUrl: 'https://cdn.test/p.jpg',
    createdAt: new Date(2026, 9, 10, 10, 41).toISOString(),
    ...overrides,
  }
}

function mountCard(r: Report = report()) {
  return mount(ReportListingCard, {
    props: { report: r },
    global: { stubs: { Tags: TagsStub, FontAwesomeIcon: true } },
  })
}

describe('ReportListingCard', () => {
  it('renders type, address, date line, and distance', () => {
    const w = mountCard()
    expect(w.text()).toContain('Pothole Repair')
    expect(w.text()).toContain('1234 Market St')
    expect(w.text()).toContain('10/10/26 · 10:41 AM')
    expect(w.text()).toContain('0.1 mi')
  })

  it('shows the photo when mediaUrl is present', () => {
    const w = mountCard()
    expect(w.find('img').attributes('src')).toBe('https://cdn.test/p.jpg')
    expect(w.find('.listing-card__photo--placeholder').exists()).toBe(false)
  })

  it('shows a placeholder block when there is no photo', () => {
    const w = mountCard(report({ mediaUrl: undefined }))
    expect(w.find('img').exists()).toBe(false)
    expect(w.find('.listing-card__photo--placeholder').exists()).toBe(true)
  })

  it('overlays a status tag colored by statusTagColor', () => {
    const w = mountCard()
    const tag = w.find('.tag-stub')
    expect(tag.text()).toBe('In Progress')
    expect(tag.attributes('data-color')).toBe('purple')
  })

  it('renders no status tag when status is empty', () => {
    const w = mountCard(report({ status: '' }))
    expect(w.find('.tag-stub').exists()).toBe(false)
  })

  it('renders the service-color dot', () => {
    const w = mountCard()
    expect(w.find('.listing-card__dot').exists()).toBe(true)
  })

  it('omits date and distance rows when data is missing', () => {
    const w = mountCard(report({ createdAt: undefined, distance: undefined as unknown as number }))
    expect(w.text()).not.toContain('·')
    expect(w.text()).not.toContain('mi')
  })
})
```

- [ ] **Step 6: Run to verify they fail**

Run: `npm run test:run -- src/components/ReportListingCard.test.ts`
Expected: FAIL — cannot resolve the component.

- [ ] **Step 7: Implement the card**

Create `src/components/ReportListingCard.vue`:

```vue
<!-- ABOUTME: Report listing card for the finder's left panel (Figma ".311 Report listing"):
     photo + status tag overlay, service icon + type, address, date line, color dot, distance. -->
<script setup lang="ts">
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faImage } from '@fortawesome/pro-solid-svg-icons'
import { Tags } from '@phila/phila-ui-tags'
import type { Report } from '@/composables/useNearbyReports'
import { statusTagColor } from '@/utils/reportCard'
import { serviceTypeIconDefinition } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'
import { formatDistance } from '@/utils/distance'
import { formatCardTimestamp } from '@/utils/datetime'

const props = defineProps<{ report: Report }>()

const timestamp = computed(() => formatCardTimestamp(props.report.createdAt))
const distance = computed(() => formatDistance(props.report.distance))
const typeColor = computed(() => serviceTypeColor(props.report.serviceType))
</script>

<template>
  <article class="listing-card">
    <div class="listing-card__media">
      <img v-if="report.mediaUrl" class="listing-card__photo" :src="report.mediaUrl" alt="" />
      <div v-else class="listing-card__photo listing-card__photo--placeholder">
        <FontAwesomeIcon :icon="faImage" />
      </div>
      <Tags
        v-if="report.status"
        class="listing-card__status"
        :text="report.status"
        :color="statusTagColor(report.status)"
      />
    </div>
    <div class="listing-card__body">
      <p class="listing-card__title">
        <FontAwesomeIcon
          class="listing-card__type-icon"
          :icon="serviceTypeIconDefinition(report.serviceType)"
          :style="{ color: typeColor }"
        />
        {{ report.serviceType }}
      </p>
      <p class="listing-card__address">{{ report.address }}</p>
      <p v-if="timestamp" class="listing-card__meta">{{ timestamp }}</p>
    </div>
    <div class="listing-card__aside">
      <span class="listing-card__dot" :style="{ backgroundColor: typeColor }" />
      <span v-if="distance" class="listing-card__distance">{{ distance }}</span>
    </div>
  </article>
</template>

<style scoped>
.listing-card {
  display: flex;
  gap: var(--spacing-s, 0.75rem);
  background: #fff;
  border-radius: 8px;
  padding: var(--spacing-s, 0.75rem);
}
.listing-card__media {
  position: relative;
  flex: none;
}
.listing-card__photo {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  object-fit: cover;
}
.listing-card__photo--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ui-color-grey-200, #e3e3e3);
  color: var(--ui-color-grey-400, #a1a1a1);
  font-size: 1.5rem;
}
.listing-card__status {
  position: absolute;
  top: -8px;
  left: -8px;
}
.listing-card__body {
  flex: 1;
  min-width: 0;
}
.listing-card__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  margin: 0;
}
.listing-card__address {
  margin: 2px 0 0;
}
.listing-card__meta {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
.listing-card__aside {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  flex: none;
}
.listing-card__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.listing-card__distance {
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
</style>
```

NOTE: if `faImage` is not in `@fortawesome/pro-solid-svg-icons` under that name, check with `grep -o "faImage[A-Za-z]*" node_modules/@fortawesome/pro-solid-svg-icons/index.d.ts | head` and use the plain `faImage`.

- [ ] **Step 8: Run to verify they pass**

Run: `npm run test:run -- src/components/ReportListingCard.test.ts src/utils/datetime.test.ts` → PASS.

- [ ] **Step 9: Commit**

```bash
git -C /Users/darren.mcdowell/Projects/pinboard-3 add apps/philly-311/frontend/src/utils apps/philly-311/frontend/src/components
git -C /Users/darren.mcdowell/Projects/pinboard-3 commit -m "feat(philly-311): ReportListingCard + card timestamp formatting"
```

---

### Task 4: philly-311 — `FilterChips`

**Files:**
- Create: `apps/philly-311/frontend/src/components/FilterChips.vue`
- Create: `apps/philly-311/frontend/src/components/FilterChips.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/components/FilterChips.test.ts`:

```ts
// ABOUTME: Tests for FilterChips — leading All Filters chip, icon chips, selection
// ABOUTME: emit + aria-pressed, and the overflow scroll chevron.
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterChips from './FilterChips.vue'

const OPTIONS = [
  { value: 'Pothole Repair', label: 'Pothole Repair' },
  { value: 'Graffiti Removal', label: 'Graffiti Removal' },
]

function mountChips(modelValue = 'all') {
  return mount(FilterChips, {
    props: { options: OPTIONS, modelValue },
    global: { stubs: { FontAwesomeIcon: true } },
  })
}

function setOverflow(w: ReturnType<typeof mountChips>, overflowing: boolean) {
  const row = w.find('.filter-chips__row').element as HTMLElement
  Object.defineProperty(row, 'scrollWidth', { value: overflowing ? 900 : 400, configurable: true })
  Object.defineProperty(row, 'clientWidth', { value: 400, configurable: true })
}

describe('FilterChips', () => {
  it('renders the leading All Filters chip plus one chip per option', () => {
    const chips = mountChips().findAll('button.filter-chips__chip')
    expect(chips.map((c) => c.text())).toEqual(['All Filters', 'Pothole Repair', 'Graffiti Removal'])
  })

  it('marks the selected chip with aria-pressed', () => {
    const w = mountChips('Pothole Repair')
    const chips = w.findAll('button.filter-chips__chip')
    expect(chips[0].attributes('aria-pressed')).toBe('false')
    expect(chips[1].attributes('aria-pressed')).toBe('true')
  })

  it('All Filters is pressed when the model is "all"', () => {
    const w = mountChips('all')
    expect(w.findAll('button.filter-chips__chip')[0].attributes('aria-pressed')).toBe('true')
  })

  it('emits update:modelValue on chip click', async () => {
    const w = mountChips()
    await w.findAll('button.filter-chips__chip')[2].trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['Graffiti Removal'])
    await w.findAll('button.filter-chips__chip')[0].trigger('click')
    expect(w.emitted('update:modelValue')?.[1]).toEqual(['all'])
  })

  it('hides the scroll chevron when the row does not overflow', async () => {
    const w = mountChips()
    setOverflow(w, false)
    window.dispatchEvent(new Event('resize'))
    await w.vm.$nextTick()
    expect(w.find('.filter-chips__scroll').exists()).toBe(false)
  })

  it('shows the chevron when overflowing and scrolls the row on click', async () => {
    const w = mountChips()
    setOverflow(w, true)
    window.dispatchEvent(new Event('resize'))
    await w.vm.$nextTick()
    const row = w.find('.filter-chips__row').element as HTMLElement
    row.scrollBy = vi.fn()
    await w.find('.filter-chips__scroll').trigger('click')
    expect(row.scrollBy).toHaveBeenCalledWith({ left: 320, behavior: 'smooth' })
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test:run -- src/components/FilterChips.test.ts` → FAIL (unresolved component).

- [ ] **Step 3: Implement**

Create `src/components/FilterChips.vue`:

```vue
<!-- ABOUTME: Horizontal filter-chip row for the finder panel: leading "All Filters" chip,
     icon chips per service type, and a scroll chevron when the row overflows. -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSliders, faChevronRight } from '@fortawesome/pro-solid-svg-icons'
import { serviceTypeIconDefinition } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'

const props = defineProps<{
  options: { value: string; label: string }[]
  modelValue: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const rowRef = ref<HTMLElement | null>(null)
const canScroll = ref(false)

function updateOverflow() {
  const row = rowRef.value
  canScroll.value = !!row && row.scrollWidth > row.clientWidth + 1
}

function scrollRight() {
  const row = rowRef.value
  if (!row) return
  row.scrollBy({ left: Math.round(row.clientWidth * 0.8), behavior: 'smooth' })
}

onMounted(() => {
  updateOverflow()
  window.addEventListener('resize', updateOverflow)
})
onBeforeUnmount(() => window.removeEventListener('resize', updateOverflow))
</script>

<template>
  <div class="filter-chips">
    <div ref="rowRef" class="filter-chips__row">
      <button
        type="button"
        class="filter-chips__chip"
        :class="{ 'filter-chips__chip--selected': modelValue === 'all' }"
        :aria-pressed="modelValue === 'all'"
        @click="emit('update:modelValue', 'all')"
      >
        <FontAwesomeIcon :icon="faSliders" />
        All Filters
      </button>
      <button
        v-for="opt in props.options"
        :key="opt.value"
        type="button"
        class="filter-chips__chip"
        :class="{ 'filter-chips__chip--selected': modelValue === opt.value }"
        :aria-pressed="modelValue === opt.value"
        @click="emit('update:modelValue', opt.value)"
      >
        <FontAwesomeIcon
          :icon="serviceTypeIconDefinition(opt.label)"
          :style="{ color: serviceTypeColor(opt.label) }"
        />
        {{ opt.label }}
      </button>
    </div>
    <button
      v-if="canScroll"
      type="button"
      class="filter-chips__scroll"
      aria-label="Scroll filters"
      @click="scrollRight"
    >
      <FontAwesomeIcon :icon="faChevronRight" />
    </button>
  </div>
</template>

<style scoped>
.filter-chips {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-m, 1rem) var(--spacing-s, 0.75rem);
}
.filter-chips__row {
  display: flex;
  gap: var(--spacing-xs, 0.5rem);
  overflow-x: auto;
  scrollbar-width: none;
  white-space: nowrap;
}
.filter-chips__row::-webkit-scrollbar {
  display: none;
}
.filter-chips__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  padding: 6px 12px;
  border: 1px solid var(--ui-color-grey-300, #d6d6d6);
  border-radius: 9999px;
  background: #fff;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}
.filter-chips__chip--selected {
  background: var(--ui-color-primary, #0f4d90);
  border-color: var(--ui-color-primary, #0f4d90);
  color: #fff;
}
.filter-chips__chip--selected :deep(svg) {
  color: #fff !important;
}
.filter-chips__scroll {
  flex: none;
  margin-left: var(--spacing-xs, 0.5rem);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--ui-color-grey-300, #d6d6d6);
  background: #fff;
  cursor: pointer;
}
</style>
```

- [ ] **Step 4: Run to verify they pass**

Run: `npm run test:run -- src/components/FilterChips.test.ts` → PASS. (The chevron test expects `clientWidth * 0.8 = 320` from the faked 400px row.)

- [ ] **Step 5: Commit**

```bash
git -C /Users/darren.mcdowell/Projects/pinboard-3 add apps/philly-311/frontend/src/components
git -C /Users/darren.mcdowell/Projects/pinboard-3 commit -m "feat(philly-311): FilterChips — icon chip row with All Filters lead + scroll chevron"
```

---

### Task 5: philly-311 — landing composition, callout label, trending removal, reportCard slim-down

**Files:**
- Modify: `apps/philly-311/frontend/src/pages/LandingPage.vue`
- Modify: `apps/philly-311/frontend/src/components/ReportCallout.vue` (+ its test)
- Modify: `apps/philly-311/frontend/src/utils/reportCard.ts` (+ its test)
- Delete: `apps/philly-311/frontend/src/components/TrendingArticles.vue`, `TrendingArticles.test.ts` (approved by spec)
- Test: `apps/philly-311/frontend/src/pages/LandingPage.test.ts`

- [ ] **Step 1: Update tests first (failing)**

1. `ReportCallout.test.ts`: change the CTA-label assertion to `Start a report`.
2. `reportCard.test.ts`: remove the `locationCardInfo`/tags assertions; keep/extend `statusTagColor` tests and assert `reportToLocation` returns `{ id, name, latitude, longitude }` (no `locationCardInfo` key).
3. `LandingPage.test.ts` (read it first; it exists — follow its mocking conventions): update to assert (a) `TrendingArticles` is no longer rendered, (b) `FilterChips` renders inside the locations-header with the common-category options and `modelValue` wired to the finder filter, (c) the Pinboard stub no longer receives `location-panel-filter`, (d) a `location-card` slot template renders `ReportListingCard` when `reportById` resolves and plain name text otherwise. Adapt to the file's existing stub strategy — if it stubs `Pinboard`, assert via the stub's received props/slots.

- [ ] **Step 2: Run to verify the updated tests fail**

Run: `npm run test:run -- src/pages/LandingPage.test.ts src/components/ReportCallout.test.ts src/utils/reportCard.test.ts`
Expected: FAIL on the new assertions (old markup still in place).

- [ ] **Step 3: Implement**

1. `ReportCallout.vue`: CTA text → `Start a report`. Update the ABOUTME header's stale "(a placeholder until the report wizard lands in Increment 3)" — the wizard has landed; the comment is provably outdated. New header: `<!-- ABOUTME: Landing-header callout: heading + lede + the primary "Start a report" CTA routing to /report. -->`
2. `utils/reportCard.ts`: drop the `MapCardProps`/`TagsProps` imports, the tag-building, and `locationCardInfo`; `reportToLocation` returns `{ id: report.id, name: report.serviceType, latitude: report.lat, longitude: report.lng }`. Keep `statusTagColor` + `formatDistance` import only if still used here (move nothing). Update the file's ABOUTME to match.
3. `LandingPage.vue`:
   - Remove `TrendingArticles` import + usage and `useTrendingArticles` import + `trending.init()` (the composable FILE stays — it is the Answers data layer; do not delete it).
   - Add imports: `FilterChips`, `ReportListingCard`.
   - `filterOptions` becomes category options only (no `'all'` entry — FilterChips owns the All chip):
     ```ts
     const categoryOptions = commonCategories.map((c) => ({ value: c.title, label: c.title }))
     ```
   - Remove `:location-panel-filter="filterOptions"` and `@selected-locations-filter="finder.setFilter"` from `<Pinboard>`.
   - `locations-header` slot becomes:
     ```vue
     <template #locations-header>
       <ReportCallout />
       <FilterChips
         :options="categoryOptions"
         :model-value="finder.filter.value"
         @update:model-value="finder.setFilter"
       />
     </template>
     ```
   - Add the card slot:
     ```vue
     <template #location-card="{ location }">
       <ReportListingCard
         v-if="finder.reportById(location.id)"
         :report="finder.reportById(location.id)!"
       />
       <p v-else>{{ location.name }}</p>
     </template>
     ```
4. Delete `TrendingArticles.vue` + `TrendingArticles.test.ts` (`git rm`).
5. Confirm `useTrendingArticles.ts` ABOUTME already describes its data-layer role; if it references the landing strip, reword to "Data layer for the Answers content section" (evergreen, no future-tense promises).

- [ ] **Step 4: Run the full philly-311 suite + type check + lint**

Run: `npm run test:run && npm run type-check && npm run lint`
Expected: all green (remember: if packages/ui changed since its last build, rebuild it first).

- [ ] **Step 5: Commit**

```bash
git -C /Users/darren.mcdowell/Projects/pinboard-3 add -A apps/philly-311/frontend/src
git -C /Users/darren.mcdowell/Projects/pinboard-3 commit -m "feat(philly-311): finder panel matches Figma — FilterChips, listing cards, Start a report; drop trending UI"
```

---

### Task 6: Full verification + live smoke

- [ ] **Step 1: Whole-workspace gates**

Run, each from its own directory: packages/ui `npm run test:run && npm run type-check && npm run lint && npm run build`; philly-311 `npm run test:run && npm run type-check && npm run lint`; primary-care-finder type-check; **oem-flood-finder type-check** (it reads `locationCardInfo` unguarded and its build gates on type-check — Task 1 review finding).
Expected: all green.

- [ ] **Step 2: Live Playwright smoke — philly-311 landing at 1440×900**

`npm run dev` (background) in philly-311. Verify against Figma 9789:30329:
1. Panel order: callout ("Start a report" CTA) → chips row → search box → list.
2. Chips: single row, icons visible, "All Filters" first with sliders icon; row scrolls (chevron appears if overflowing); clicking "Pothole Repair" filters BOTH the list and the map pins; clicking "All Filters" restores everything.
3. Cards: photo or placeholder left with status tag overlay, icon + type, address, date line `M/D/YY · h:mm AM`, color dot, distance.
4. Trending strip GONE.
5. Click a card → detail opens (slot wrapper still wired); hover highlights.
6. Console: only the known benign `Unexpected token '<'` (Pictometry).
Take a 1440px screenshot for Darren. Kill the server.

- [ ] **Step 3: Record results**

Any smoke-found fix follows TDD and gets its own commit.

---

### After all tasks

Final review (superpowers:requesting-code-review) over `311-staging..HEAD`, then superpowers:finishing-a-development-branch — Option 1: `--no-ff` merge to `311-staging`, keep branch, push nothing.
