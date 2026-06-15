# F3 — Accessibility + Dedupe Slice (Design Spec)

**Date:** 2026-06-15
**Slice:** F3 (fidelity) — Philly 311 port in `pinboard-3` (`apps/philly-311`)
**Branch:** `feat/f3-a11y-dedupe` off `311-staging`, `--no-ff` merge, branch kept, nothing pushed.
**Predecessors:** Increment 3 + fidelity F1 (finder) + F2 (Answers pages) merged to `311-staging`.

## Goal

Pay down the accessibility and duplication debt accumulated across Increments 1–3 and
fidelity slices F1–F2, without changing user-visible behavior except where an a11y fix
intentionally improves it (focus management, screen-reader semantics). One slice,
dedupe-first: consolidate the duplicated CSS/markup into app-local components, then layer
the targeted a11y fixes onto those components and a few specific call sites.

## Scope

**In scope:**

1. **`PillButton` component** — consolidate the duplicated primary/outline pill CTA buttons.
2. **`ServiceTypeIcon` component** — consolidate the triplicated service-type "icon disc".
3. **`.sr-only` global utility** — single definition, remove per-component copies.
4. **Confirmation focus-on-heading** (a11y) — replace `role="status"` reliance.
5. **QuestionField / DetailsStep aria** (a11y) — `aria-describedby` + `aria-required`.
6. **AddressSearch combobox roles** (a11y) — complete the combobox ARIA contract.
7. **FilterChips ResizeObserver** — container-driven overflow detection.

**Explicitly out of scope (deferred):**

- `reportById` O(N²) lookup in the finder (perf; low urgency at current volumes).
- LocationsPanel focusable-wrapper a11y — lives in `@pinboard/ui` (shared package); deferred
  per the "don't touch the shared package mid-slice" rule.
- Submit-side contact (parked on the team's Salesforce whiteboarding).

## Architecture decisions (from brainstorm)

- **App-local components, not `@pinboard/ui`.** Both new components live under
  `apps/philly-311/frontend/src/components/`. The pill aesthetic and the service-type icon disc
  are app-specific; no other Pinboard app needs them today (YAGNI on a shared-package change).
- **`@phila/phila-ui-button` is NOT adopted** for the pills — it isn't a pill by default and
  would fight its own styling / not cover the outline variant cleanly.
- **FilterChips and StepIndicator keep their own `border-radius: 9999px`.** FilterChips is a
  toggle-*chip* pattern (selected state + per-chip dynamic `serviceTypeColor`); StepIndicator's
  radius is incidental to progress dots. Neither is a CTA button, so neither uses `PillButton`.
  The `9999px` literal legitimately remains in those two files after this slice.

## Component designs

### 1. `PillButton.vue` (`src/components/PillButton.vue`)

Consolidates the primary-fill and outline pill CTAs.

**API:**
- `variant?: 'primary' | 'outline'` — default `'primary'`.
- `to?: RouteLocationRaw` — when present, renders `<RouterLink :to>`; otherwise renders
  `<button>`. (Use `<component :is>` to switch element.)
- Native `<button>` attrs pass through when in button mode: `type` (default `'button'`),
  `disabled`, and `@click`. The `disabled` opacity style is preserved.
- Default slot = label content (text and/or trailing glyph like `→`).

**Styling:** one definition of the pill (`border-radius: 9999px`, weight, padding) with the
two variants:
- `primary`: `background: var(--ui-color-primary, #0f4d90); color: #fff; border: none`.
- `outline`: `background: #fff; color: var(--ui-color-primary, #0f4d90); border: 1px solid
  var(--ui-color-primary, #0f4d90)`.
Token fallbacks match today's values so there is no visual change.

**Call sites replaced (primary CTAs unless noted):**
- `src/pages/report/ReviewStep.vue` — submit button (primary).
- `src/pages/AnswerDetailPage.vue` — "Start a report →" (primary, `to="/report"`).
- `src/pages/AnswersPage.vue` — "Load more" (outline, button with `:disabled`).
- `src/pages/ReportConfirmationPage.vue` — "Report another issue" (primary, `to="/report"`).
  The adjacent `confirmation__link` ("See reports near you") is a plain link, NOT a PillButton.
- `src/pages/ReportPage.vue` — wizard Next/Skip/Back/Reset controls that use the pill style
  (audit each; only the ones currently rendered as `9999px` pills convert — match current
  appearance exactly).
- `src/pages/report/IssueTypeStep.vue` — pill CTA(s) present there.
- `src/pages/report/LocationStep.vue` — pill CTA(s) present there.

Each conversion is a pure refactor: the rendered DOM/classes may change, but the visual result
and behavior must be identical. Existing step/page tests must stay green; where a test queries
by the old class name, update the query to the new structure (do not weaken the assertion).

### 2. `ServiceTypeIcon.vue` (`src/components/ServiceTypeIcon.vue`)

Consolidates the icon-disc markup:
```html
<span class="...__icon" :style="{ backgroundColor: serviceTypeColor(serviceType) }">
  <FontAwesomeIcon :icon="serviceTypeIconDefinition(serviceType)" />
</span>
```

**API:**
- `serviceType: string` (required) — the component calls `serviceTypeColor(serviceType)` and
  `serviceTypeIconDefinition(serviceType)` internally (imports from `@/utils/serviceTypeMeta`
  and `@/utils/reportIcon`).
- `size?: number` — disc diameter in px; default `36`. Existing call sites use 36 (TypeSuggestions)
  and 32 (TypeDirectory), so the prop preserves both.

**Styling:** `flex: none; border-radius: 50%; display: inline-flex; align/justify center;
color: #fff;` with width/height driven by `size`.

**Decorative semantics:** the disc is decorative (the service-type name is always rendered as
visible text beside it), so the FontAwesome glyph is `aria-hidden` — no redundant SR label.

**Call sites replaced:**
- `src/components/wizard/TypeSuggestions.vue` (size 36).
- `src/components/wizard/TypeDirectory.vue` (size 32).
- `src/pages/report/IssueTypeStep.vue` (the selected-type disc).
- `src/components/wizard/AddressSearch.vue` — ONLY if it renders the same colored-disc pattern;
  the implementer verifies. (FilterChips uses an inline icon with dynamic color, NOT a disc —
  it does NOT use `ServiceTypeIcon`.)

### 3. `.sr-only` global utility

Define `.sr-only` once in an app-global stylesheet (e.g. `src/assets/app.css` or the existing
global entry) imported a single time in `src/App.vue`. Remove the scoped `.sr-only` blocks from
`StepIndicator.vue` and `AnswersPage.vue`. Visual/behavioral result unchanged.

If no app-global stylesheet exists yet, create a minimal one solely for this utility (do not
sweep other styles into it in this slice).

## Accessibility fixes

### 4. Confirmation focus-on-heading (`ReportConfirmationPage.vue`)

`role="status"` on a wrapper that already contains the `<h1>` at mount does not reliably
announce in screen readers (the live region's content is present before the SR starts watching).

**Fix:** on mount, move focus to the confirmation heading. Give the `<h1>` `tabindex="-1"` and
call `.focus()` in `onMounted` (after `nextTick`). This is the robust pattern for route-change
announcements. Keep a polite live region only if it is cheap and non-duplicative; the
focus-the-heading behavior is the primary mechanism. Add a test asserting the heading receives
focus on mount.

### 5. QuestionField / DetailsStep aria

- **QuestionField** (`src/components/wizard/QuestionField.vue`): associate each field's hint text
  with its control via `aria-describedby` (stable generated id), and set `aria-required` on the
  native input/switch when the question is required.
- **DetailsStep** (`src/pages/report/DetailsStep.vue`): wire `aria-describedby` for the
  description hint and the privacy note, and `aria-required` where applicable.

No visual change; assertions added for the wired attributes.

### 6. AddressSearch combobox roles (`src/components/wizard/AddressSearch.vue`)

The results list already uses `listbox`/`option` roles but is missing the rest of the combobox
contract. Complete it: `role="combobox"` on the input with `aria-expanded` (reflecting the open
state), `aria-controls` (pointing at the listbox id), `aria-autocomplete="list"`, and
`aria-activedescendant` for the highlighted option. Preserve the existing `open`-flag and
debounce behavior. Add assertions for the combobox attributes and their reactive values.

### 7. FilterChips ResizeObserver (`src/components/FilterChips.vue`)

Replace the `window.addEventListener('resize', updateOverflow)` approach with a `ResizeObserver`
on the chip row element, so the overflow chevron reflects the real container width (the row can
change width without a window resize — panel show/hide, sidebar, mobile bottom-sheet). Keep
`updateOverflow` logic and the `watch(options)` recompute; swap the observation source. Disconnect
the observer in `onBeforeUnmount`. jsdom has no real layout, so the unit test asserts the observer
wiring/teardown (and `updateOverflow`'s scrollWidth/clientWidth comparison can be unit-tested with
stubbed element metrics); real overflow behavior is covered by the live smoke.

## Testing

- **TDD per new component:** `PillButton` (variant rendering, button vs RouterLink mode, disabled,
  click emit, slot) and `ServiceTypeIcon` (color/icon from serviceType, size prop, aria-hidden
  glyph) get colocated unit tests written first.
- **Dedupe = behavior-preserving:** the existing suite (currently 401 green) is the guard. After
  each call-site conversion the full suite must stay green; tests that queried old class names are
  updated to the new structure without weakening assertions.
- **a11y fixes:** each gets a focused assertion (heading focus on mount; `aria-describedby`/
  `aria-required` present and correct; combobox attributes reactive).
- **Live Playwright smoke** (headed Chrome, real dev API — the F2 `/tmp` playwright-core pattern):
  1. Wizard renders; every converted CTA (Next/Skip/Back/Review submit, Start-a-report) looks and
     behaves as before; outline "Load more" on `/answers` still paginates.
  2. Issue-type step: suggestion + directory icon discs render with correct colors.
  3. Confirmation page: focus lands on the heading after submit.
  4. AddressSearch: combobox exposes `aria-expanded`/`aria-activedescendant` as the list opens and
     options are highlighted.
  5. FilterChips: chevron appears/disappears as the finder panel/viewport changes width (not just
     window resize).
  6. Console clean except the known-benign Pictometry `Unexpected token '<'`.

## Workflow

Subagent-driven (implementer + spec-review + quality-review per task), final whole-branch review,
then `finishing-a-development-branch` Option 1 (`--no-ff` merge to `311-staging`, keep the branch,
nothing pushed). Order: build `PillButton` and `ServiceTypeIcon` (with tests) → convert call sites
→ `.sr-only` global → the four a11y/observer fixes → live smoke → merge.

## Done means

- New `PillButton` and `ServiceTypeIcon` components with unit tests; all listed call sites
  converted; `.sr-only` defined once; the four a11y/observer fixes in with assertions.
- `9999px` and the icon-disc markup no longer duplicated across CTA/icon call sites (FilterChips +
  StepIndicator retain their own pill radius by design).
- Full suite green; live smoke passes; merged to `311-staging` with the branch kept.
