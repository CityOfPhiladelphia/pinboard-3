# Philly 311 — Increment 3 / Slice 3a: Wizard Shell + Image Step

- **Date:** 2026-06-10
- **Status:** Draft (pending review)
- **Repo:** `pinboard-3`
- **Branch:** `feat/philly-311-wizard-shell` (off `311-staging`)

## Background

Increment 3 builds the multi-step **report wizard** that the "Report an Issue" CTA points at
(currently a `/report` placeholder from slice 2b). The wizard's **logic is already ported**
(Increment 1): the Pinia `reportSubmission` store (with `submit()` → `POST /private/key/submit`
and `payload()`), `useServiceTypes`, `useWizardValidity`, conditional-question logic, the photo
utils (`processForClassify`), `useAis`, `useGeolocation`, and the data files. What remains is the
**UI**, built to match the UX team's Figma report flow (`node 9789:30333`).

The Figma's step model differs from the POC's. **Figma steps: Image → Issue type → Location →
Details → Review.** The per-type "questions" are not a separate step — they fold into **Issue
type**. Step 1, **Image**, is an *optional* photo upload whose ML classification suggests the
issue type (the POC had photo-classify as a side door; the Figma promotes it to step 1).

This slice (3a) is the **wizard shell + stepper + routing + the Image step**. Subsequent slices:
3b Issue type, 3c Location, 3d Details, 3e Review + submit + confirmation.

## Decisions (brainstorm)

| Decision | Choice |
| --- | --- |
| Step model | Match the Figma: **Image / Issue type / Location / Details / Review** (questions fold into Issue type) |
| Port vs design | Reuse the ported logic; build the UI to the Figma |
| 3a scope | Wizard shell + `StepIndicator` + `/report/*` routes + reworked guard + **Image step** |
| Photo classify | Image step calls `/classify`; **capture** suggestions in 3a, **consume** them (pre-select issue type) in 3b |
| Pull location from photo | **Deferred** — no backend/EXIF support (classify returns only image + type suggestions) |
| Steps 2–5 in 3a | Thin placeholder step pages so the shell + stepper + navigation work end-to-end; replaced by 3b–3e |
| Submit success target | `/report/confirmation` (built in 3e) |

## Goals

- `/report` renders the wizard **shell** inside `PinboardShell`: breadcrumb + `StepIndicator`
  (5 steps) + `<router-view>` + a contextual controls footer.
- The five `/report/*` child routes exist; the `wizardGuard` is reworked for the optional-Image
  flow (no longer traps the user when Image is skipped).
- The **Image step** (`/report`) matches the Figma: "Images (optional)" + ML note + Upload/Camera
  dropzones + `0/1` counter; a chosen photo is processed + classified, the `mediaUrl` and
  suggestions stored; Skip and Next both advance.
- Tests green; no `@pinboard/ui` or other-app changes.

## Non-goals (later slices)

- The Issue type / Location / Details / Review step *content* (3b–3e) — placeholders only here.
- Consuming the photo suggestions to pre-select the issue type (3b).
- "Pull location from photo" (EXIF) — no support.
- The `/report/confirmation` page + submit UX (3e).
- Figma-faithful global chrome already deferred (navbar search placement, etc.).

## Architecture

### Routing + guard

`router/index.ts` replaces the single `/report` placeholder with the wizard shell + nested steps:

```ts
{
  path: '/report',
  component: () => import('@/pages/ReportPage.vue'),
  children: [
    { path: '', component: () => import('@/pages/report/ImageStep.vue') },          // step 1
    { path: 'issue-type', component: () => import('@/pages/report/IssueTypeStep.vue') }, // placeholder
    { path: 'location', component: () => import('@/pages/report/LocationStep.vue') },    // placeholder
    { path: 'details', component: () => import('@/pages/report/DetailsStep.vue') },      // placeholder
    { path: 'review', component: () => import('@/pages/report/ReviewStep.vue') },        // placeholder
  ],
}
```

**`wizardGuard` rework.** The ported guard redirects any `/report/*` sub-path to `/report` when
`store.isEmpty`. That traps the user once Image is optional (skipping Image leaves the store empty,
so advancing to `/report/issue-type` would bounce back). Rework: Image (`/report`) and Issue type
(`/report/issue-type`) are always allowed (Issue type is where a category is chosen); deeper steps
(`/report/location` and beyond) require `store.category`. The existing deep-link query handling
(category/lat/lng) is preserved. (In 3a, steps 2–5 are placeholders, so the practical effect is
that the wizard is freely navigable; the category gate becomes meaningful as 3b–3e land.)

### Wizard shell — `pages/ReportPage.vue`

Replaces the 2b placeholder. Renders, inside `PinboardShell`'s main area:
- a breadcrumb ("Home / Report an issue"),
- **`StepIndicator`** (the 5 steps with completed/active/future states),
- `<router-view>` for the active step,
- a **contextual controls footer**: the Image step shows **Reset · Skip · Next**; other steps show
  **Back · Next** (Review will show Submit in 3e). `canAdvance` is provided via
  `provide('wizard:canAdvance', ref)` and set by each step (the POC pattern); Next is disabled when
  `!canAdvance`. "Reset" calls `store.reset()` and returns to `/report`.

The `STEPS` table drives both the stepper and the Back/Next routing:
`[{title:'Image',path:'/report'}, {title:'Issue type',path:'/report/issue-type'}, {title:'Location',
path:'/report/location'}, {title:'Details',path:'/report/details'}, {title:'Review',path:'/report/review'}]`.

### `components/wizard/StepIndicator.vue`

Ported from the POC and reskinned to the Figma: five numbered circles connected by lines; a
completed step shows a checkmark on a filled circle, the active step a filled circle with its
number, future steps an outlined circle; titles below each. Emits `navigate(path)` when a
completed step is clicked. Props: `steps`, `currentStep`, `completedThrough`.

### Image step — `pages/report/ImageStep.vue`

Matches the Figma "Image" frame:
- Heading "Images (optional)" + the ML note ("…pull location data from your photo and suggest the
  issue type…"), a `0/1` counter, and two dropzones (**Upload** and **Camera** — the camera one
  uses `<input capture>`).
- On a chosen file: `processForClassify(file)` → `POST /private/key/classify` (via `useApi`) →
  on success, `store.setPhoto({ mediaUrl: result.imageUrl, previewUrl })` and store the returned
  `classifications` as `store.photoSuggestions` (see store change). On classify error, surface an
  inline message and keep the step usable (the photo is optional).
- Both **Skip** and **Next** advance to `/report/issue-type` (the step is optional). `canAdvance`
  stays `true` throughout.

### Store change (small, additive)

Add to `reportSubmission` store: a `photoSuggestions: PhotoSuggestion[]` state field
(`PhotoSuggestion = { serviceType: string; confidence: number }`) plus a `setPhotoSuggestions`
action, and clear it in `reset()`. This persists the Image step's classification across the route
change so the Issue type step (3b) can pre-select. (Type added to `types/wizard.ts`.) The classify
API also returns `caseType` per suggestion; it is intentionally dropped here (unused in 3a/3b) —
add it to `PhotoSuggestion` later if a step needs it for service-type matching.

### Placeholder steps 2–5

`pages/report/IssueTypeStep.vue`, `LocationStep.vue`, `DetailsStep.vue`, `ReviewStep.vue` are thin
placeholders ("<Step> — coming soon") that set `canAdvance` appropriately (true) so the shell's
Next/Back navigation is exercisable end-to-end. Each is replaced by its real slice (3b–3e).

## Data flow

```
Image step: file → processForClassify → POST /classify
  → store.setPhoto({mediaUrl, previewUrl}) + store.setPhotoSuggestions(classifications)
Shell: STEPS table + route → StepIndicator state + Back/Next routing; canAdvance via provide/inject
```

## Error / empty handling

- Classify failure → inline error in the Image step; photo stays optional, user can Skip/Next or
  retry. No throw escapes.
- The wizard renders inside `PinboardShell`; no map/finder involvement.

## Testing (TDD)

- **`StepIndicator.test.ts`** — renders 5 steps; marks completed (checkmark)/active/future; emits
  `navigate` for a completed step; does not navigate for a future step.
- **`ReportPage.test.ts`** — renders the stepper + a router-view outlet + contextual controls
  (Skip on Image, Back/Next elsewhere); `canAdvance=false` disables Next; "Reset" calls
  `store.reset()`. (Mount with a memory router + the wizard child routes; Pinia active.)
- **`ImageStep.test.ts`** — selecting a file calls `processForClassify` (mocked) then the classify
  API (mocked via `useApi`/fetch), and on success calls `store.setPhoto` + `store.setPhotoSuggestions`;
  Skip/Next advance; a classify error shows the inline message and does not throw.
- **`router/routes.test.ts` (extended)** — the five `/report/*` routes resolve. NOTE: making
  `/report` a parent-with-index-child changes `r.resolve('/report').matched` from length 1 to 2
  (parent + index child); update that existing assertion (e.g. assert the last matched record's
  component, or `toHaveLength(2)`).
- **`router/wizardGuard.test.ts` (reworked)** — Image + Issue type allowed when the store is empty;
  Location and beyond redirect to `/report` without a category; allowed with a category. (Extend
  the already-ported guard test.)
- Component tests stub `@pinboard/ui` where a step mounts anything from it (the shell itself uses
  only router + StepIndicator, no `@pinboard/ui`); the existing global `setup.ts` phila-ui stubs
  cover form components.

## Risks / watch-items (resolve during planning)

1. **`/classify` access.** Confirm `POST /private/key/classify` works with the API key (the
   `submit`/`nearby-issues` routes are key-gated; classify likely is too). The `useApi` POST path
   is already exercised by `store.submit`. Verify the request/response shape against the POC
   (`{imgB64}` → `{classifications, imageUrl}`).
2. **`processForClassify` in jsdom.** It uses canvas/image APIs; tests mock it rather than run real
   image processing.
3. **`wizardGuard` rework** must not break the existing (ported) guard test — extend it; the
   `to.path === '/report'` carve-out + deep-link query handling stay.
4. **Camera capture** — the "Camera" dropzone is `<input type="file" accept="image/*" capture>`;
   on desktop it behaves as a normal file picker. No native-camera integration needed.
5. **StepIndicator reskin** is best-effort to the Figma; exact pixel fidelity is not a gate.

## Definition of Done

1. `/report` renders the wizard shell (breadcrumb + 5-step `StepIndicator` + step outlet +
   contextual controls) inside `PinboardShell`.
2. The Image step matches the Figma (optional photo upload/camera + ML note + 0/1) and, on a chosen
   photo, classifies + stores `mediaUrl` + suggestions; Skip/Next advance.
3. The five `/report/*` routes resolve; the reworked `wizardGuard` doesn't trap a user who skips
   Image and gates Location+ on a category.
4. `type-check`, `lint`, `test:run`, `build` green for `@pinboard/philly-311`.
5. `turbo run build/type-check/test:run` — no regression to oem/pc/ui; `@pinboard/ui` unchanged.

## Out of scope / next

3b Issue type (consumes the photo suggestions), 3c Location, 3d Details, 3e Review + submit +
`/report/confirmation`. Then the deferred fidelity slice (with 2a.1) and Increment 4 (CDK/deploy).
