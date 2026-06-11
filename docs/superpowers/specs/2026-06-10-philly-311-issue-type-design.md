# Philly 311 — Increment 3 / Slice 3b: Issue Type Step

- **Date:** 2026-06-10
- **Status:** Draft (pending review)
- **Repo:** `pinboard-3`
- **Branch:** `feat/philly-311-issue-type` (off `311-staging`)

## Background

Slice 3a delivered the report-wizard shell (5-step stepper, contextual controls, optional Image
step that stores `photoSuggestions` from `/classify`). Step 2, **Issue type**, is a placeholder.
This slice replaces it with the real step: choose a service type (with the photo suggestions
surfaced as "AI generated recommendations") and answer that type's conditional questions. Per the
3a decision, **questions fold into the Issue type step** — there is no separate questions step.

The wizard logic is already ported and tested (Increment 1): `useServiceTypes` (catalog from
`POST`-free `GET /private/key/service-types`, session-cached, each entry
`{serviceType, caseType, description, questions[]}`), `visibleQuestions()` (Salesforce
controller/dependentValues conditional logic in `utils/conditional.ts`), `serviceTypeMeta`
(icon + color per type), and store actions `setCategory` / `setQuestion` / `customFields` /
`photoSuggestions`. The POC has a complete `QuestionField.vue` input-type mapping to port.

## Decisions (brainstorm)

| Decision | Choice |
| --- | --- |
| Slice scope | Whole step in one slice: selection + suggestions + questions + validity |
| List grouping | Group by **`caseType`** as-is (35 groups over 53 types; single-member groups keep their heading). The Figma's lorem "Category" headings map to this real taxonomy. |
| Questions placement | **Swap view** within the step: selection UI swaps to a selected-type summary + questions once a category is chosen; "Change" returns |
| Phase state | Derived from `store.category` (no local flag) — deep links / Back land correctly |
| Architecture | Thin `IssueTypeStep` + 3 children: `TypeSuggestions`, `TypeDirectory`, `QuestionField` (POC port) |
| Suggestions | Top 3 of `store.photoSuggestions` by confidence, filtered to catalog membership; no confidence % shown; panel hidden when photo absent or no suggestion survives the filter |
| Type-swap questions | The Figma's "Yes → update issue type to Vacant Lot Cleanup" mechanic is **out** — no data-model support; such questions render as plain inputs |
| Validity | `useWizardValidity(computed)`: category chosen AND every required *visible* question answered |

## Goals

- `/report/issue-type` renders the real step inside the wizard shell: pick view (photo
  recommendations + searchable caseType-grouped directory) and questions view (selected-type
  summary + conditional questions), gated correctly by `canAdvance`.
- The Image step's `photoSuggestions` are consumed (pre-surface, one-click select).
- Tests green; no `@pinboard/ui` or other-app changes.

## Non-goals (later slices)

- Location / Details / Review step content (3c–3e) — placeholders remain.
- "Possible address based on photo" on the Location step (3c, and no backend support today).
- Confidence percentages, type-swap question mechanics, Figma-faithful global chrome.

## Architecture

### `pages/report/IssueTypeStep.vue` (replaces the placeholder)

Thin orchestrator. Loads the catalog on mount via `useServiceTypes().load()` (cached after first
call); renders:

- **Loading**: "Loading issue types…" placeholder.
- **Error**: inline error + Retry button (re-calls `load()`), styled like ImageStep's error.
- **Pick view** (`!store.category`): heading "Issue type * (required)"; if `store.photo`, a
  two-column band — photo preview (`previewUrl ?? mediaUrl`) left, `TypeSuggestions` right;
  then "All issue types" with `TypeDirectory`.
- **Questions view** (`store.category` set): selected-type summary card (icon via
  `serviceTypeMeta`, name, description, **Change** button → `store.setCategory(null)`);
  `visibleQuestions(questions, store.customFields, store.category)` rendered as a list of
  `QuestionField`s; a "* Required" legend when any visible question is required; or
  "No additional details needed for this issue type." when the type has no visible questions.

Validity: `useWizardValidity(computed(() => !!store.category && visible.every(q => !q.required ||
(store.customFields[q.field] ?? '') !== '')))`. The shell's Next stays disabled until valid.

Selection from either child does `store.setCategory(name)`; existing store semantics clear
`customFields` on change (including the Change button's `setCategory(null)`).

### `components/wizard/TypeSuggestions.vue`

Props: `suggestions: PhotoSuggestion[]`, `catalog: ServiceType[]`. Emits `select(serviceType)`.
Internally: sort by `confidence` desc, keep entries whose `serviceType` exists in the catalog,
take 3. Renders the Figma's recommendation panel ("AI generated recommendations" / "Based on
objects in your photo") as buttons: icon (`serviceTypeIcon`/`serviceTypeColor`), type name,
catalog description. Renders nothing when the filtered list is empty (parent also hides the
photo band).

### `components/wizard/TypeDirectory.vue`

Props: `catalog: ServiceType[]`. Emits `select(serviceType)`. A search field filters across
type name, description, and the keywords in `data/service_types.json`; below it the full list
grouped by `caseType` (groups A–Z, members A–Z), two-column rows of icon + name + description
(stacking to one column on small screens). While searching, non-matching rows and emptied groups
drop out; an all-empty result shows "No issue types match your search." Search is client-side
only (the catalog is ~53 entries, already in memory).

### `components/wizard/QuestionField.vue` (port from POC)

Port `/web/webportal/frontend/src/components/wizard/QuestionField.vue` with its input-type
mapping: `picklist` ≤4 options → phila-ui RadioGroup, >4 → native select; `multipicklist` →
CheckboxGroup (values joined with `;`); `boolean` → Switch; `date` → DateField; `double`/number →
TextField with numeric mask; `textarea` → native textarea; default → TextField.
**Dependency note:** the app already has `@phila/phila-ui-radio`, `-checkbox`, and `-text-field`
but NOT `@phila/phila-ui-switch` or `@phila/phila-ui-date-field` — the port must add those two
(npm 0.0.5 / 0.0.9; the POC uses both). Required fields
get an asterisk in the label. Value changes emit to the parent which calls
`store.setQuestion(field, value)` (empty values delete the key — existing store semantics).
No "showError" machinery: the shell's disabled Next is the gate (plus the "* Required" legend).

### Data flow

```
mount → useServiceTypes.load() → catalog
pick view:  photoSuggestions ∩ catalog → TypeSuggestions ─select→ store.setCategory
            catalog → caseType groups → TypeDirectory   ─select→ store.setCategory
questions:  catalog[category].questions × customFields → visibleQuestions → QuestionField[]
            QuestionField ─input→ store.setQuestion(field, value)
validity:   category && required visible answered → useWizardValidity → shell Next
```

## Error / empty handling

- Catalog load failure → inline error + Retry; Next stays disabled (no category choosable).
- Suggestions referencing unknown types are dropped; empty result hides the panel (and the photo
  band shows nothing — pick view is then just the directory).
- Search with no matches → "No issue types match your search."
- Type with zero visible questions → friendly no-details line, Next enabled.
- Changing a controller answer hides dependents per `visibleQuestions`; hidden-question answers
  may linger in `customFields` (pre-existing POC/store behavior — `payload()` sends what's
  answered; acceptable, unchanged in this slice).

## Testing (TDD)

- **`TypeDirectory.test.ts`** — caseType grouping (groups + members sorted); search matches
  name/description/keyword (e.g. "wheelchair" → ADA Curb Ramp); empty-search message; row click
  emits `select` with the exact `serviceType` string.
- **`TypeSuggestions.test.ts`** — confidence sort; catalog filter (unknown types dropped);
  top-3 cap; renders nothing when empty; click emits `select`.
- **`QuestionField.test.ts`** — port POC coverage: each input type renders; required asterisk;
  change emits the new value; multipicklist joins with `;`.
- **`IssueTypeStep.test.ts`** — pick view without category, questions view with; selecting via
  directory flips the view and writes the store; Change returns to pick and clears
  `customFields`; canAdvance false until required visible questions answered (via provided ref +
  `WIZARD_CAN_ADVANCE_KEY`), true for zero-question types; conditional follow-up appears when its
  controller is answered; catalog error → Retry re-calls load; suggestions panel only when
  `store.photo` and surviving suggestions exist.
- A required `boolean` question counts as unanswered until first toggled (`customFields` key
  absent) — if any catalog type has one, `IssueTypeStep.test.ts` covers it explicitly.
- `useApi` is mocked in component tests (its own tests cover fetching); store is real Pinia.
- Slice ends with a real-browser Playwright smoke (photo → suggestion → questions → Next, and a
  no-photo search → select → questions path).

## Definition of Done

1. `/report/issue-type` renders pick view (recommendations when photo present + searchable
   grouped directory) and questions view (summary + Change + conditional questions) per the
   Figma's structure with real data.
2. Selecting a type (suggestion or directory) writes `store.category`; Change clears it;
   required visible questions gate Next via `useWizardValidity`.
3. `type-check`, `lint`, `test:run`, `build` green for `@pinboard/philly-311`; turbo
   build/type-check/test green monorepo-wide; `@pinboard/ui` unchanged.
4. Playwright smoke passes on the live dev server.

## Out of scope / next

3c Location, 3d Details, 3e Review + submit + `/report/confirmation`; then the deferred fidelity
slice (with 2a.1) and Increment 4 (CDK/deploy).
