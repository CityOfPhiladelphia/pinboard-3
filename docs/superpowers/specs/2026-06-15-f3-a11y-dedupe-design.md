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
6. **AddressSearch combobox + keyboard nav** (a11y) — combobox ARIA contract plus arrow-key
   navigation, Enter-to-select, Escape-to-close, and `aria-activedescendant`.
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
- `src/pages/report/IssueTypeStep.vue` — `issue-step__retry` (outline, error-path retry).
- `src/pages/report/LocationStep.vue` — `location-step__geolocate` (outline, "Use my current
  location"). Note these two are outline CTAs, not primary Start/Next/Submit buttons.

Note on `ReportPage.vue`: its `wizard__reset` is a plain text link with **no** `border-radius`
— it is NOT a pill and does NOT convert. Only the controls currently rendered as `9999px` pills
convert.

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

- **QuestionField** (`src/components/wizard/QuestionField.vue`): set `aria-required` on the
  control when the question is required. **No `aria-describedby`** here — QuestionField renders no
  hint text and the `QuestionField` type carries no hint/description field, so there is nothing to
  describe (this is a correction from the brainstorm; `aria-describedby` applies only to
  DetailsStep, which does have hints). QuestionField renders most types via phila-ui components
  (TextField, RadioGroup, CheckboxGroup, DateField) plus a native large-picklist `<select>`,
  `<textarea>`, and a `Switch`. The implementer must verify whether each phila-ui component
  forwards `aria-required` to its underlying control; set it where it takes effect and do NOT add
  a non-functional attribute on a component that drops it. If a required type can't carry
  `aria-required` through phila-ui, note it as a phila-ui gap rather than working around it.
- **DetailsStep** (`src/pages/report/DetailsStep.vue`): wire `aria-describedby` for the
  description hint (`details-step__hint`) and the privacy note (`details-step__privacy-note`)
  via stable ids, and `aria-required` on the description control.

No visual change; assertions added for the wired attributes.

### 6. AddressSearch combobox + keyboard navigation (`src/components/wizard/AddressSearch.vue`)

The results list already uses `listbox`/`option` roles but the input is not a combobox and the
list has no keyboard navigation. F3 adds the **full combobox a11y contract** (Darren chose the
complete keyboard-nav option over a static-only contract):

- **Static contract:** `role="combobox"` on the input with `aria-expanded` (reflecting the open
  state), `aria-controls` (the listbox id), `aria-autocomplete="list"`.
- **Keyboard navigation (new behavior):** track an `activeIndex` over the current results.
  ArrowDown / ArrowUp move the active option (wrapping or clamping — implementer picks the
  conventional behavior and documents it), `Enter` selects the active option (same path as a
  click), `Escape` closes the list and clears `activeIndex`. Each result `<li>`/option gets a
  stable `id`; the input's `aria-activedescendant` reflects the active option's id (absent when
  nothing is active). Typing resets `activeIndex` to none. Pointer hover MAY set the active
  option but is not required.
- Preserve the existing `open`-flag, `resolving` feedback, and debounce behavior, and the
  existing stale-result handling — keyboard nav must not reintroduce the pick-echo refire.

Tests: assert the static combobox attributes; assert ArrowDown/ArrowUp move `aria-activedescendant`
reactively; assert `Enter` on an active option selects it; assert `Escape` closes the list. Real
end-to-end keyboard behavior is also exercised in the live smoke.

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
  4. AddressSearch: arrow keys move the highlighted option (`aria-activedescendant` tracks it),
     `Enter` selects it, `Escape` closes the list; `aria-expanded` reflects open state.
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
