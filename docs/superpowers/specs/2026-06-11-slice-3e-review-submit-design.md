# Slice 3e — Review step, submit, and confirmation

**Date:** 2026-06-11
**Repo:** `pinboard-3`, app `apps/philly-311`, branch `311-slice-3e-review-submit` off `311-staging`
**Status:** Approved by Darren (design conversation 2026-06-11)

## Goal

Complete the report wizard: a real Review step (replacing the stub at
`frontend/src/pages/report/ReviewStep.vue`) that summarizes the report, submits it to the
API, and lands on a new `/report/confirmation` page showing the case number. Also fixes the
latent `store.submit()` setup-scope bug and strips dead field-error plumbing.

There is **no Figma frame** for Review or confirmation (the report-flow section node
9789:30333 ends at the Details frames). Design source is the POC
(`311-mobile-app/web/webportal/frontend/src/pages/report/ReviewStep.vue` and
`components/wizard/ReviewSummary.vue`) plus the real backend contract, restyled to match the
existing pinboard-3 wizard steps.

## Backend contract (verified 2026-06-11 against `311-mobile-app/api/oit-se-311-api`)

`POST /private/key/submit` (`apps/api/submit.ts`):

- **Input** (`SubmissionInput`): `serviceRequestType`, `description`, `address`, `private`
  required; `zipCode`, `latitude`, `longitude`, `mediaUrl`, `customFields`
  (`Record<string,string>`) optional. Lat/lng bounds-checked to Philadelphia.
- **Validation errors:** HTTP 400 with a **single string** — `{ "error": "<first failure>" }`.
  **There is no `fieldErrors` object anywhere in the API.** The POC's
  `lastFieldErrors` → `fieldErrorRoute` machinery is dead code against this contract.
- **Salesforce errors:** `{ error: { message, detail } }`, HTTP 400 (4xx from SF) or 502.
- **Success:** HTTP 200 with the created issue: `id`, `caseNumber`, `serviceType`, `status`,
  `address`, `description`, `mediaUrl`, `latitude`, `longitude`, `createdAt`, `updatedAt`,
  `childCount`, optional `customFields[]`.
- Contact fields (`SuppliedName/Email/Phone`) are **not accepted** — reserved "app level"
  (`serviceTypes.ts` AGENT_FIELDS). Contact stays collect-and-store only (parked per 3d).

The store's `payload()` (`stores/reportSubmission.ts:119-137`) already builds this body
correctly, including `private: !publicVisibility`. It is unchanged by this slice.

## Decisions (made with Darren)

1. **Error handling matches the real contract.** On submit failure, show the API's error
   message in a `role="alert"` callout on the Review step (generic fallback message for
   network/parse failures); the user stays on Review to retry or use the per-section Edit
   links. Drop all field-error plumbing: `ApiError.fieldErrors` and `parseError`'s
   `body.fieldErrors` extraction (`composables/useApiError.ts`), `State.lastFieldErrors`
   (`stores/reportSubmission.ts`), and their tests. No error-string sniffing/routing.
2. **Confirmation is minimal and store-carried.** Success heading + reference number
   (`caseNumber`, falling back to `id`), "Report another issue" CTA → `/report`, link to the
   finder (`/`). Data comes from a new `store.submitted` slot — nothing in the URL, no
   refetch. Guard redirects to `/report` when `submitted` is empty.
3. **Review shows contact info** (name/email/phone from the Details step) even though it is
   not sent to the API today. Review reflects what the user entered; submit-side contact
   wiring lands later (SSO/team decision) with no Review change needed.
4. **Live smoke includes a real submit** to the dev API (creates an actual Salesforce case in
   the dev org). Darren OK'd this explicitly.

## Components

### 1. `ReviewSummary.vue` (new, `frontend/src/components/wizard/`)

Read-only summary of the store, four sections, each with an Edit link
(`router-link`) to its owning step. Step model is the Figma five-step model, so the POC's
section→route mapping is remapped:

| Section | Contents | Edit link |
|---|---|---|
| Photo | thumbnail `<img>` from `photo.previewUrl ?? photo.mediaUrl`, else "—" | `/report` |
| Issue type | `store.category` (else "—"); answered questions as a `<dl>` | `/report/issue-type` |
| Location | `location.address`, or `"{lat}, {lng}"` when address is empty; zip in parens if present; "—" if no location | `/report/location` |
| Details | description; contact name/email/phone ("—" when empty); "Public visibility: Yes/No" | `/report/details` |

**Question labels:** resolved via `useServiceTypes()` (cached catalog,
`composables/useServiceTypes.ts`) — find the `ServiceType` matching `store.category`, map
each `customFields` key to its `QuestionField.label`; fall back to the raw field key when the
catalog hasn't loaded or the key is unknown. Call `load()` on mount (cache makes this free
when IssueTypeStep already loaded it). Only render entries present in `store.customFields`
(answered questions), in catalog question order, unknown keys last.

Photo thumbnail `alt` text: "Photo attached to this report" (decorative-adjacent but
informative). No lightbox/zoom — fidelity slice territory.

### 2. `ReviewStep.vue` (replaces stub, `frontend/src/pages/report/`)

- Header ("Review") + intro line, `<ReviewSummary />`, error callout, **"Submit report"**
  button. The step owns the button; `ReportPage.vue` already hides Next on the last step and
  is **not modified**.
- `useWizardValidity` is **not used** (no Next button to gate). The stub's current
  `canAdvance = true` on-mount write is dropped along with the stub.
- **Submit wiring (the setup-scope fix):** `useApi` is created once at setup with a lazily
  assigned body — ImageStep's pattern (`pages/report/ImageStep.vue:20-30`; `useApi.fetchData`
  reads `opts.body` at call time):

  ```ts
  const submitOpts = { url: '/private/key/submit', method: 'POST' as const, body: undefined as unknown }
  const submitApi = useApi<SubmitResponse>(submitOpts)

  async function submit() {
    submitOpts.body = store.payload()
    const result = await submitApi.fetchData()
    if (submitApi.error.value || !result) { /* show error, stay */ return }
    store.recordSubmission({ id: result.id, caseNumber: result.caseNumber })
    router.push('/report/confirmation')
  }
  ```

- Button disabled while `isLoading` (label flips to "Submitting…") and unless
  `store.category && store.location && store.description` (mirrors `payload()`'s
  preconditions — belt-and-braces over the route guard; `payload()` itself is also wrapped so
  a throw surfaces as the error callout, not an unhandled rejection).
- Error callout: `role="alert"`, shows `submitApi.error.value.message`, or a generic
  "Something went wrong submitting your report. Please try again." for empty/odd messages.
  Cleared on the next submit attempt.
- Double-submit protection = the disabled-while-loading button (matches POC level).

### 3. Store changes (`stores/reportSubmission.ts`)

- **Delete the `submit()` action** (the setup-scope-broken one) — replaced by the
  component-side fetch above. Darren approved removing this implementation.
- **Delete `lastFieldErrors`** from `State`/`initial`.
- **Add `submitted: { id: string; caseNumber?: string } | null`** to state (`initial()`
  returns `null`).
- **Pre-existing bug found during planning:** Pinia's object-form `$patch` deep-merges plain
  objects, so `reset()`'s `$patch(initial())` never clears `customFields` or `contact`
  (merging `{}` into a populated object is a no-op). Existing tests miss those two fields.
  Fix in this slice (TDD: failing test first): use the function form,
  `this.$patch((state) => Object.assign(state, initial()))`.
- **Add `recordSubmission(result)`**: `setPhoto(null)` (blob revoke), then
  `this.$patch((state) => Object.assign(state, initial(), { submitted: result }))` —
  function form for the same deep-merge reason; `submitted` is set in the same patch.
  `photoSuggestions` is a wizard field and is cleared by this.
- `reset()` (image-step "start over" path) now also clears `submitted` — starting a new
  report discards the old confirmation.
- Move `SubmitResponse` to `types/wizard.ts` (ReviewStep needs it; keep one definition).
- **3d invariant update:** "reset is image-step-only" becomes **"reset never fires while
  DetailsStep is mounted"** — `recordSubmission` fires from ReviewStep (DetailsStep
  unmounted), so DetailsStep's one-way description sync stays safe. Record this in the code
  comment on `recordSubmission` only if non-obvious; otherwise tests pin it.

### 4. Confirmation page (new `frontend/src/pages/ReportConfirmationPage.vue`)

- **Standalone route `/report/confirmation`** — a sibling of `/report`, **not** a wizard
  child (no step indicator / Back chrome). Vue Router matches the static sibling fine.
- Content: success heading in a `role="status"` region ("Thanks — your report was
  submitted."), "Reference number: **{caseNumber ?? id}**", primary CTA "Report another
  issue" → `/report`, secondary link "See reports near you" → `/`.
- Styled like the other wizard pages (same container/typography patterns as ReportPage
  content).

### 5. Router (`router/index.ts`)

- Add the `/report/confirmation` route **before** the `wizardGuard` category gate applies to
  it: the guard currently treats every `/report/*` path as a wizard step and would bounce it
  (no category after reset). Update `wizardGuard`: `/report/confirmation` returns `true` when
  `store.submitted` is set, `'/report'` otherwise — checked **before** the deep-link/category
  logic.

## Dead code removal

`composables/useApiError.ts`: drop the `fieldErrors` field and constructor param from
`ApiError`, drop `body.fieldErrors` extraction in `parseError`; update `useApiError.test.ts`
(it currently asserts fieldErrors parsing) and any `useApi.test.ts` references. Grep for
`fieldErrors` app-wide to catch stragglers.

## bd issues to file (POC backport — run `bd` from `311-mobile-app/api/`)

1. **POC submit payload omits required `private` field** — every POC submit 400s against the
   current API (`webportal/frontend/src/stores/reportSubmission.ts` payload vs
   `apps/api/submit.ts` validation). Fix: send `private: !publicVisibility` (as ported).
2. **POC dead field-error machinery** — `lastFieldErrors`, `ReviewStep.fieldErrorRoute`
   regex routing, and `useApiError` fieldErrors parsing have no API counterpart; remove or
   align with the single-string contract.
3. **POC `reset()` `$patch(initial())` deep-merge** — verify the POC store uses the same
   object-form `$patch` pattern; if so, `customFields`/`contact` survive reset there too.

(Verified 2026-06-11: no existing bd issues mention these.)

## Testing

TDD per task; subagent-driven execution (implementer + spec-review + quality-review per
task). Unit tests use the existing conventions: vitest + @vue/test-utils, Pinia
`setActivePinia`, `vi.mock` at composable boundaries, steps mounted with
`WIZARD_CAN_ADVANCE_KEY` provided where relevant (`__test__/setup.ts` global stubs).

- **ReviewSummary:** renders all four sections from a populated store; em-dash fallbacks for
  missing photo/contact/category/location; coords fallback when address empty; question
  labels from catalog with raw-key fallback (mock `useServiceTypes`); question rows follow
  catalog order with unknown keys last (one ordering test); Edit links point at the right
  routes; visibility Yes/No.
- **ReviewStep:** Submit disabled when store incomplete; click → `fetchData` with
  `store.payload()` as body; "Submitting…"/disabled while loading; API error message shown in
  `role="alert"` and user stays; generic fallback message; success → `recordSubmission`
  called with id/caseNumber and router pushed to `/report/confirmation`; `payload()` throw
  surfaces in the callout. `useApi` mocked at the composable boundary (as ImageStep tests
  do); store and router behavior are the real things under test.
- **Store:** `recordSubmission` sets `submitted`, clears wizard fields, preserves
  `submitted` through its internal reset; `reset()` clears `submitted`; `lastFieldErrors`
  gone (type-level).
- **Router/guard:** `/report/confirmation` redirects to `/report` without `submitted`,
  passes with it; existing wizard-guard tests still green.
- **useApiError:** updated tests assert single-message parsing for both error shapes
  (`{error: string}` and `{error: {message, detail}}`) and no fieldErrors field. The current
  `parseError` (`body.error ?? body.message`) would yield an **object** for the Salesforce
  shape; fix: when `body.error` is an object, message = `error.message`, with `error.detail`
  appended after " — " when present (detail often carries the actionable Salesforce text);
  `detail` is not stored separately on `ApiError`.
- **Live Playwright smoke** (end of slice, real dev API): full wizard run — photo upload
  (classify), issue type + questions, location pick, details (description ≥10 chars,
  visibility), Review shows everything entered, Edit link round-trip preserves state,
  Submit → confirmation shows a real case number; wizard is clean on "Report another issue".
  **This files a real case in the dev Salesforce org** (Darren approved). Use an obviously
  test-flavored description. Known benign console error: `Unexpected token '<'` from
  `@phila/phila-ui-map-core` (Pictometry) — not ours.

## Out of scope (unchanged carry-forwards)

Submit-side contact fields (parked — team whiteboarding Salesforce side); a11y polish list
(aria-describedby/aria-required etc.); icon-disc dedupe; StepIndicator `completedThrough`
revisit; AddressSearch epoch/error-gating items from 3c; fidelity/visual-polish slice;
Increment 4 (CDK/deploy).

## Merge

`finishing-a-development-branch` Option 1: `--no-ff` merge to `311-staging`, branch kept
until Darren says tidy, nothing pushed.
