# Philly 311 — Increment 3 / Slice 3d: Details Step

- **Date:** 2026-06-11
- **Status:** Draft (pending review)
- **Repo:** `pinboard-3`
- **Branch:** `feat/philly-311-details` (off `311-staging`)

## Background

Slices 3a–3c delivered the wizard shell, Image, Issue type (with the per-type conditional
questions folded in, per the 3a decision), and Location. Step 4, **Details**, is a placeholder.
This slice replaces it with the real step: a required description, optional contact info, and the
report-visibility toggle.

The Figma Details frames (9789:31069 / 31179 in `aRmWuYVwmG9S2gXdJxCjqL`) show a sub-stepper of
per-type questions ending in a required "Describe the issue" textarea. The questions already live
in the Issue type step, and the per-type helper copy shown in the Figma (e.g. the HHW list for
Illegal Dumping) has no data source in the catalog — so this step reduces to the description
plus the POC's Details content (contact, visibility). The Figma designs no contact, visibility,
or Review frames; the POC and the backend contract fill those gaps (data over Figma).

Backend contract (`POST /private/key/submit`, verified against the API's `submit.ts`):
`description` required; **`private: boolean` required** — the ported `payload()` does not send it
today, so submit would 400 (latent; surfaced during this brainstorm); contact fields are NOT
accepted by the API. The API's own `serviceTypes.ts` excludes `SuppliedName`/`SuppliedEmail`/
`SuppliedPhone` from per-type questions as "handled at app level", but the submit endpoint never
grew them.

Store support is fully ported (Increment 1): `description`, `setDescription`, `contact`,
`setContact`, `publicVisibility`, `setPrivacy`, and `payload()`. The POC has `DetailsStep.vue`
and `ContactInfo.vue` to port.

## Decisions (brainstorm)

| Decision | Choice |
| --- | --- |
| Contact info | **Collect and store, do NOT send** (POC behavior). Darren + team are aware of Salesforce-contact intricacies (authed vs unauthed) and are deliberately parking submit-side contact; SSO integration will own the authed path. Flagged as a known gap with submit — NOT silently dropped, NOT an API change now. |
| Privacy | Port the POC "Make this report public" toggle (default unchecked = private, matches mobile) AND fix `payload()` now: `private: !publicVisibility`. Closes the known 400 before 3e. |
| Description floor | POC's 10-character minimum (trimmed). Backend only requires non-empty; the floor is a UX nudge. |
| Description label | Figma's copy: "Describe the issue * (required)". Generic supporting text ("At least 10 characters.") — the Figma's per-type helper copy has no data source. |
| Photo upload | Not in Details — the Image step owns photos (wizard structure differs from POC). |
| Per-type question sub-stepper (Figma 31069) | Already shipped inside Issue type (3a/3b decisions); not duplicated here. |
| Architecture | Thin `DetailsStep` + 1 child: `ContactInfo` (POC port with auth-prefill). Description + visibility inline in the step. |
| Validity | `useWizardValidity(computed)`: trimmed description length ≥ 10. No `showError` machinery — the shell's disabled Next is the gate (3b/3c pattern). |

## Goals

- `/report/details` renders the real step: required description (gates Next), optional contact
  fields with auth-prefill, visibility toggle.
- `payload()` sends `private` (required by the backend).
- Tests green; no `@pinboard/ui` or other-app changes.

## Non-goals (later)

- Sending contact in the submit payload (parked pending team whiteboarding; SSO owns authed path).
- Per-type description prompts (no data source).
- Review step content / submit wiring (3e) — placeholder remains.

## Architecture

### `pages/report/DetailsStep.vue` (replaces the placeholder)

Single-column form (max-width ~640px, matching the Issue type questions column). Top to bottom:

- Heading "Details" (h1, step-title conventions from IssueTypeStep/LocationStep).
- Label **"Describe the issue * (required)"** over a native `<textarea>` (rows=4), supporting
  text "At least 10 characters." A local `ref` seeded from `store.description`, watched →
  `store.setDescription` (POC pattern; survives Back/Next remounts because the store is the
  source of truth).
- `<ContactInfo />`.
- Visibility `<fieldset>`: legend "Visibility"; checkbox "Make this report public" bound
  `:checked="store.publicVisibility"` → `store.setPrivacy(checked)`; explainer copy: "Public
  reports show up on the map. Off by default; only you and 311 staff see your private reports."

Validity: `useWizardValidity(computed(() => description.value.trim().length >= 10))`.

### `components/wizard/ContactInfo.vue` (POC port)

Fieldset "Contact info (optional)" + "If we have questions, we'll get in touch using these.";
name/email/phone inputs (`autocomplete` attrs as in the POC). Local refs seeded from
`store.contact`; any change → `store.setContact({name, email, phone})`. Auth prefill: on mount
and on `isAuthenticated` flip, fill empty name/email from `useAuth()` (`userName`,
`user.username`) ONCE (`prefilled` flag) — never clobbers user-entered values. The global test
setup already mocks `@phila/sso-vue` (unauthenticated by default; tests override per-case).

### Store / types

- `types/wizard.ts` `SubmitPayload` gains `private: boolean`.
- `stores/reportSubmission.ts` `payload()` adds `private: !this.publicVisibility`.
- No other store changes — contact stays store-only (see Decisions).

### Data flow

```
textarea → local ref → store.setDescription
ContactInfo inputs → store.setContact   (auth prefill: useAuth → empty fields, once)
visibility checkbox → store.setPrivacy
validity: description.trim().length >= 10 → useWizardValidity → shell Next
payload(): description, private: !publicVisibility (+ existing fields; contact NOT included)
```

## Error / empty handling

- No inline validation errors: Next stays disabled below the description floor (shell-owned
  gate, consistent with 3b/3c). The supporting text states the floor up front.
- Whitespace-only description does not count (trimmed length).
- Contact fields are free-text; no client validation (optional, not sent anywhere yet).
- Back/Next navigation preserves all values via the store.

## Testing (TDD)

- **`DetailsStep.test.ts`** — canAdvance (provided ref + `WIZARD_CAN_ADVANCE_KEY`) false when
  empty / 9 chars / 10 spaces, true at 10 trimmed chars; pre-seeded `store.description` is shown
  and validity reflects it on mount; typing writes `store.description`; checkbox toggles
  `store.publicVisibility` (and reflects store state); `ContactInfo` is rendered.
- **`ContactInfo.test.ts`** (port POC coverage) — unauthenticated: no prefill; authenticated:
  empty name/email prefilled once from auth, phone untouched; existing store values are not
  clobbered by prefill; edits write `store.setContact`; auth flip after user edits does not
  overwrite them.
- **`reportSubmission.test.ts`** (extend) — `payload()` includes `private: true` by default and
  `private: false` after `setPrivacy(true)`; existing payload tests updated for the new field.
- Slice ends with a real-browser Playwright smoke: walk Image(skip) → Issue type → Location →
  Details; Next disabled until a ≥10-char description; fill contact; toggle public; Next lands on
  the Review placeholder; Back returns with values intact.

## Definition of Done

1. `/report/details` renders description + contact + visibility per this spec; Next gated on the
   description floor via `useWizardValidity`.
2. `payload()` sends `private` (default true); contact remains store-only and the gap is
   documented (this spec + port-status memory).
3. `type-check`, `lint`, `test:run`, `build` green for `@pinboard/philly-311`; turbo green
   monorepo-wide; `@pinboard/ui` unchanged.
4. Playwright smoke passes on the live dev server.

## Out of scope / next

3e Review + submit + `/report/confirmation` (includes the `store.submit()` setup-scope `useApi`
fix); submit-side contact (parked — team whiteboarding; SSO authed path); the fidelity slice;
Increment 4 (CDK/deploy).
