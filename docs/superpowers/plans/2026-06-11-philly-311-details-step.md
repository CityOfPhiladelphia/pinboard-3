# Philly 311 — Slice 3d: Details Step — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Details placeholder with the real step — required description (10-char floor gating Next), optional contact info with auth prefill (stored, deliberately NOT sent), and the report-visibility toggle — plus the `private` field the submit payload is required to send.

**Architecture:** Thin `DetailsStep.vue` holding the description textarea + visibility fieldset inline, with one ported child `ContactInfo.vue` (auth-prefill-once logic). Store is the source of truth across Back/Next remounts. One store/type change: `payload()` gains `private: !publicVisibility`.

**Tech Stack:** Vue 3.5, Pinia (`reportSubmission`), `useWizardValidity`, `@phila/sso-vue` (`useAuth`, globally mocked in tests), Vitest.

**Spec:** `docs/superpowers/specs/2026-06-11-philly-311-details-step-design.md`

**Conventions for every task:**
- Paths relative to `pinboard-3/` root. Branch `feat/philly-311-details` off `311-staging` — create before Task 1: `git checkout 311-staging && git checkout -b feat/philly-311-details`.
- `APP` = `apps/philly-311/frontend`. Filtered scripts: `pnpm --filter @pinboard/philly-311 <script>` (`type-check`, `lint`, `test:run`, `format`, `build`).
- Prettier `semi: false, singleQuote: true, printWidth: 100` — run `format` before each commit.
- TDD per task: failing test → run (fails) → implement → run (passes) → `type-check` + `lint` → `format` → commit. Full `test:run` green at every commit.
- **Scope:** only `APP` src. No `@pinboard/ui`, no other apps, no API changes (submit-side contact is deliberately parked — see spec Decisions).
- ESLint forbids non-null assertions (`!`) — use optional chaining / casts. Read input values as `(w.find(...).element as HTMLInputElement).value`.
- All new code files start with `ABOUTME: ` header lines.

**Known facts (verified):**
- Store (`APP/src/stores/reportSubmission.ts`): `description` + `setDescription`, `contact` + `setContact` (merge semantics), `publicVisibility` (default `false`) + `setPrivacy`, `payload()` currently WITHOUT `private`. `isEmpty` getter checks contact fields by falsiness, so empty-string writes keep it accurate.
- `types/wizard.ts`: `SubmitPayload` lacks `private`; `ContactInfo` interface (`{name?, email?, phone?}`) already exists — the new `ContactInfo.vue` component shares the name; they never import each other, but keep imports unambiguous (component path import vs `type` import).
- Store tests (`APP/src/stores/reportSubmission.test.ts`): the `payload` describe's happy-path test asserts the full body with `toEqual` — it MUST be updated to include `private: true`. The `submit` describe never asserts the body shape; no other payload-shape assertions exist.
- `useWizardValidity(validity: ComputedRef<boolean>)` + `WIZARD_CAN_ADVANCE_KEY` (`'wizard:canAdvance'`) — shell owns Back/Next; steps have NO Continue button; tests import the KEY constant for the provide (3c convention).
- `APP/src/__test__/setup.ts` mocks `@phila/sso-vue` globally (unauthenticated, `authReady:false`); per-test `vi.mock('@phila/sso-vue', ...)` overrides it — the POC's ContactInfo.test does exactly this with a controllable `authState` object.
- Placeholder `APP/src/pages/report/DetailsStep.vue` forces `canAdvance = true` on mount — the new tests fail against it for the right reasons.
- POC sources: `/Users/darren.mcdowell/Projects/311-mobile-app/web/webportal/frontend/src/pages/report/DetailsStep.vue`, `components/wizard/ContactInfo.vue` (+ `.test.ts`). POC differences to NOT port: PhotoUpload (Image step owns photos), local Continue button + `showError` (shell owns Next).
- Step styling conventions: see `IssueTypeStep.vue` / `LocationStep.vue` — `__title` 1.25rem/700, `__required` grey 400-weight span, CSS custom properties with fallbacks, 640px content max-width for forms, BEM block classes.
- Monorepo gate task name is `test:run` (NOT `test`): `pnpm turbo run build type-check test:run`.

---

## Task 1: `payload()` sends `private`

**Files:**
- Modify: `apps/philly-311/frontend/src/types/wizard.ts` (SubmitPayload)
- Modify: `apps/philly-311/frontend/src/stores/reportSubmission.ts` (payload())
- Test: `apps/philly-311/frontend/src/stores/reportSubmission.test.ts`

- [ ] **Step 1: Write the failing tests.** In the existing `describe('payload', ...)` block add:

```ts
    it('includes private: true by default (reports are private unless made public)', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      store.setDescription('A problem')
      expect(store.payload().private).toBe(true)
    })

    it('includes private: false after the report is made public', () => {
      const store = useReportSubmissionStore()
      store.setCategory('Pothole Repair')
      store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
      store.setDescription('A problem')
      store.setPrivacy(true)
      expect(store.payload().private).toBe(false)
    })
```

And update the happy-path test's `toEqual` body to include `private: true` (insert after `description`):

```ts
      expect(store.payload()).toEqual({
        serviceRequestType: 'Pothole Repair',
        description: 'Large pothole near the bus stop',
        private: true,
        address: '1234 Main St',
        zipCode: '19107',
        latitude: 39.95,
        longitude: -75.16,
      })
```

- [ ] **Step 2: Run — must fail.**

```bash
pnpm --filter @pinboard/philly-311 test:run reportSubmission
```
Expected: the two new tests fail (`private` undefined) and the happy-path `toEqual` fails (missing `private`).

- [ ] **Step 3: Implement.** In `types/wizard.ts`, add to `SubmitPayload` after `description`:

```ts
  /** Required by the API: true unless the user opted into public visibility. */
  private: boolean
```

In `reportSubmission.ts` `payload()`, add to the `body` literal after `description`:

```ts
        private: !this.publicVisibility,
```

- [ ] **Step 4: Run — must pass.** Same command; full payload + submit describes green.

- [ ] **Step 5: Gates + commit.**

```bash
pnpm --filter @pinboard/philly-311 test:run && pnpm --filter @pinboard/philly-311 type-check && pnpm --filter @pinboard/philly-311 lint && pnpm --filter @pinboard/philly-311 format
git add apps/philly-311/frontend/src/types/wizard.ts apps/philly-311/frontend/src/stores/reportSubmission.ts apps/philly-311/frontend/src/stores/reportSubmission.test.ts
git commit -m "fix(philly-311): submit payload sends required private flag"
```

---

## Task 2: `ContactInfo.vue` — POC port

**Files:**
- Create: `apps/philly-311/frontend/src/components/wizard/ContactInfo.vue`
- Test: `apps/philly-311/frontend/src/components/wizard/ContactInfo.test.ts`

- [ ] **Step 1: Write the failing test.**

```ts
// ABOUTME: Tests for ContactInfo — unauthenticated empty state, auth prefill-once,
// ABOUTME: field edits updating the store, and no-clobber of user edits.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, computed } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import ContactInfo from './ContactInfo.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

// Per-test controllable auth state (overrides the global setup mock)
const authState = {
  isAuthenticated: ref(false),
  user: ref<{ name?: string; username?: string } | null>(null),
  userName: computed(() => authState.user.value?.name ?? null),
}

vi.mock('@phila/sso-vue', () => ({
  useAuth: () => authState,
  createB2CPlugin: () => ({ install: () => undefined }),
}))

function inputValue(w: ReturnType<typeof mount>, selector: string): string {
  return (w.find(selector).element as HTMLInputElement).value
}

beforeEach(() => {
  setActivePinia(createPinia())
  authState.isAuthenticated.value = false
  authState.user.value = null
})

describe('ContactInfo', () => {
  it('renders empty fields when unauthenticated and does not touch the store', async () => {
    const w = mount(ContactInfo)
    await flushPromises()
    expect(inputValue(w, 'input[autocomplete="name"]')).toBe('')
    expect(inputValue(w, 'input[autocomplete="email"]')).toBe('')
    expect(inputValue(w, 'input[autocomplete="tel"]')).toBe('')
    const store = useReportSubmissionStore()
    expect(store.contact.name).toBeUndefined()
    expect(store.contact.email).toBeUndefined()
    expect(store.isEmpty).toBe(true)
  })

  it('prefills name and email when authenticated', async () => {
    authState.isAuthenticated.value = true
    authState.user.value = { name: 'Jane', username: 'jane@phila.gov' }
    const w = mount(ContactInfo)
    await flushPromises()
    expect(inputValue(w, 'input[autocomplete="name"]')).toBe('Jane')
    expect(inputValue(w, 'input[autocomplete="email"]')).toBe('jane@phila.gov')
    expect(inputValue(w, 'input[autocomplete="tel"]')).toBe('')
  })

  it('seeds fields from existing store values and prefill does not overwrite them', async () => {
    const store = useReportSubmissionStore()
    store.setContact({ name: 'Stored Name', email: 'stored@example.com' })
    authState.isAuthenticated.value = true
    authState.user.value = { name: 'Jane', username: 'jane@phila.gov' }
    const w = mount(ContactInfo)
    await flushPromises()
    expect(inputValue(w, 'input[autocomplete="name"]')).toBe('Stored Name')
    expect(inputValue(w, 'input[autocomplete="email"]')).toBe('stored@example.com')
  })

  it('updates store.contact when a field is edited', async () => {
    const w = mount(ContactInfo)
    await flushPromises()
    await w.find('input[autocomplete="name"]').setValue('Bob')
    await flushPromises()
    expect(useReportSubmissionStore().contact.name).toBe('Bob')
  })

  it('does not clobber a user-edited field when auth arrives after the edit', async () => {
    const w = mount(ContactInfo)
    await flushPromises()
    await w.find('input[autocomplete="name"]').setValue('My Own Name')
    await flushPromises()

    authState.isAuthenticated.value = true
    authState.user.value = { name: 'Jane', username: 'jane@phila.gov' }
    await flushPromises()

    expect(inputValue(w, 'input[autocomplete="name"]')).toBe('My Own Name')
    expect(useReportSubmissionStore().contact.name).toBe('My Own Name')
  })

  it('clearing a field writes an empty string and isEmpty stays accurate', async () => {
    const w = mount(ContactInfo)
    await flushPromises()
    await w.find('input[autocomplete="name"]').setValue('Bob')
    await w.find('input[autocomplete="name"]').setValue('')
    await flushPromises()
    const store = useReportSubmissionStore()
    expect(store.contact.name).toBe('')
    expect(store.isEmpty).toBe(true)
  })
})
```

- [ ] **Step 2: Run — must fail.**

```bash
pnpm --filter @pinboard/philly-311 test:run ContactInfo
```
Expected: FAIL — cannot resolve `./ContactInfo.vue`.

- [ ] **Step 3: Implement.**

```vue
<!-- ABOUTME: Optional contact fields, stored for later use (not yet sent on submit).
     If signed in, name/email prefill from the token once; user edits are never clobbered. -->
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useAuth } from '@phila/sso-vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

const store = useReportSubmissionStore()
const { user, userName, isAuthenticated } = useAuth()

const name = ref(store.contact.name ?? '')
const email = ref(store.contact.email ?? '')
const phone = ref(store.contact.phone ?? '')
let prefilled = false

function prefillFromAuth() {
  if (prefilled) return
  if (!isAuthenticated.value) return
  if (!name.value && userName.value) name.value = userName.value
  if (!email.value && user.value?.username) email.value = user.value.username
  prefilled = true
}

onMounted(prefillFromAuth)
watch(isAuthenticated, () => prefillFromAuth())

watch([name, email, phone], () => {
  store.setContact({ name: name.value, email: email.value, phone: phone.value })
})
</script>

<template>
  <fieldset class="contact-info">
    <legend class="contact-info__legend">Contact info (optional)</legend>
    <p class="contact-info__note">If we have questions, we'll get in touch using these.</p>
    <label class="contact-info__field">
      Name
      <input v-model="name" type="text" autocomplete="name" />
    </label>
    <label class="contact-info__field">
      Email
      <input v-model="email" type="email" autocomplete="email" />
    </label>
    <label class="contact-info__field">
      Phone
      <input v-model="phone" type="tel" autocomplete="tel" />
    </label>
  </fieldset>
</template>

<style scoped>
.contact-info {
  border: 1px solid var(--ui-color-grey-200, #e3e3e3);
  border-radius: 8px;
  padding: var(--spacing-m, 1rem);
  margin: 0;
}
.contact-info__legend {
  font-weight: 700;
  padding: 0 4px;
}
.contact-info__note {
  margin: 0 0 var(--spacing-s, 0.75rem);
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
.contact-info__field {
  display: block;
  font-weight: 600;
  margin-bottom: var(--spacing-s, 0.75rem);
}
.contact-info__field input {
  display: block;
  width: 100%;
  box-sizing: border-box;
  margin-top: 4px;
  padding: 8px 12px;
  border: 1px solid var(--ui-color-grey-400, #a1a1a1);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 400;
}
</style>
```

Note: the `ContactInfo` interface in `types/wizard.ts` shares the name — that's fine (the
component never imports the type; the store does). Don't "fix" it.

- [ ] **Step 4: Run — must pass.** `pnpm --filter @pinboard/philly-311 test:run ContactInfo` → 6 tests.

- [ ] **Step 5: Gates + commit.**

```bash
pnpm --filter @pinboard/philly-311 test:run && pnpm --filter @pinboard/philly-311 type-check && pnpm --filter @pinboard/philly-311 lint && pnpm --filter @pinboard/philly-311 format
git add apps/philly-311/frontend/src/components/wizard/ContactInfo.vue apps/philly-311/frontend/src/components/wizard/ContactInfo.test.ts
git commit -m "feat(philly-311): ContactInfo — optional contact fields with auth prefill"
```

---

## Task 3: `DetailsStep.vue` — replaces the placeholder

**Files:**
- Modify: `apps/philly-311/frontend/src/pages/report/DetailsStep.vue` (replace entirely)
- Test: `apps/philly-311/frontend/src/pages/report/DetailsStep.test.ts`

- [ ] **Step 1: Write the failing test.**

```ts
// ABOUTME: Tests for DetailsStep — description floor gating canAdvance, store sync
// ABOUTME: for description and visibility, store-seeded values, ContactInfo presence.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import DetailsStep from './DetailsStep.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { WIZARD_CAN_ADVANCE_KEY } from '@/composables/useWizardValidity'

vi.mock('@/components/wizard/ContactInfo.vue', () => ({
  default: { name: 'ContactInfo', template: '<div data-testid="contact-info" />' },
}))

function mountStep(canAdvance = ref(false)) {
  return {
    canAdvance,
    w: mount(DetailsStep, {
      global: { provide: { [WIZARD_CAN_ADVANCE_KEY]: canAdvance } },
    }),
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('DetailsStep - description floor', () => {
  it('canAdvance is false when the description is empty', async () => {
    const { canAdvance } = mountStep()
    await flushPromises()
    expect(canAdvance.value).toBe(false)
  })

  it('canAdvance stays false at 9 characters and for whitespace padding', async () => {
    const { w, canAdvance } = mountStep()
    await w.find('textarea').setValue('123456789')
    expect(canAdvance.value).toBe(false)
    await w.find('textarea').setValue('   1234567   ')
    expect(canAdvance.value).toBe(false)
  })

  it('canAdvance is true at 10 trimmed characters', async () => {
    const { w, canAdvance } = mountStep()
    await w.find('textarea').setValue('1234567890')
    expect(canAdvance.value).toBe(true)
  })
})

describe('DetailsStep - store sync', () => {
  it('typing writes store.description', async () => {
    const { w } = mountStep()
    await w.find('textarea').setValue('Big pothole on my street')
    expect(useReportSubmissionStore().description).toBe('Big pothole on my street')
  })

  it('shows a store-seeded description and is immediately valid', async () => {
    useReportSubmissionStore().setDescription('Seeded description text')
    const { w, canAdvance } = mountStep()
    await flushPromises()
    expect((w.find('textarea').element as HTMLTextAreaElement).value).toBe(
      'Seeded description text',
    )
    expect(canAdvance.value).toBe(true)
  })

  it('the visibility checkbox reflects and writes store.publicVisibility', async () => {
    const { w } = mountStep()
    const box = w.find('input[type="checkbox"]')
    expect((box.element as HTMLInputElement).checked).toBe(false)
    await box.setValue(true)
    expect(useReportSubmissionStore().publicVisibility).toBe(true)
  })
})

describe('DetailsStep - composition', () => {
  it('renders the ContactInfo section', () => {
    const { w } = mountStep()
    expect(w.find('[data-testid="contact-info"]').exists()).toBe(true)
  })

  it('has no Continue button (the shell owns Next)', () => {
    const { w } = mountStep()
    expect(w.find('button').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: Run — must fail.**

```bash
pnpm --filter @pinboard/philly-311 test:run DetailsStep
```
Expected: FAIL — the placeholder has no textarea/checkbox and forces `canAdvance` true on mount.

- [ ] **Step 3: Implement.** Replace the placeholder entirely:

```vue
<!-- ABOUTME: Wizard step 4 — details: required description (10-char floor gates Next),
     optional contact info (stored, not yet sent), and report visibility. -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useWizardValidity } from '@/composables/useWizardValidity'
import ContactInfo from '@/components/wizard/ContactInfo.vue'

const MIN_DESCRIPTION = 10

const store = useReportSubmissionStore()
const description = ref(store.description)
watch(description, (v) => store.setDescription(v))

useWizardValidity(computed(() => description.value.trim().length >= MIN_DESCRIPTION))

function setPrivacy(e: Event) {
  store.setPrivacy((e.target as HTMLInputElement).checked)
}
</script>

<template>
  <div class="details-step">
    <h1 class="details-step__title">Details</h1>

    <label class="details-step__label" for="details-description">
      Describe the issue <span class="details-step__required">* (required)</span>
    </label>
    <textarea id="details-description" v-model="description" class="details-step__textarea" rows="4"></textarea>
    <p class="details-step__hint">At least 10 characters.</p>

    <ContactInfo />

    <fieldset class="details-step__privacy">
      <legend class="details-step__privacy-legend">Visibility</legend>
      <label class="details-step__privacy-toggle">
        <input type="checkbox" :checked="store.publicVisibility" @change="setPrivacy" />
        Make this report public
      </label>
      <p class="details-step__privacy-note">
        Public reports show up on the map. Off by default; only you and 311 staff see your
        private reports.
      </p>
    </fieldset>
  </div>
</template>

<style scoped>
.details-step {
  max-width: 640px;
}
.details-step__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-m, 1rem);
}
.details-step__label {
  display: block;
  font-weight: 600;
  margin-bottom: 4px;
}
.details-step__required {
  font-weight: 400;
  color: var(--ui-color-grey-700, #4a4a4a);
  font-size: 0.875rem;
}
.details-step__textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid var(--ui-color-grey-400, #a1a1a1);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
}
.details-step__hint {
  margin: 4px 0 var(--spacing-l, 2rem);
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
.details-step__privacy {
  border: 1px solid var(--ui-color-grey-200, #e3e3e3);
  border-radius: 8px;
  padding: var(--spacing-m, 1rem);
  margin: var(--spacing-l, 2rem) 0 0;
}
.details-step__privacy-legend {
  font-weight: 700;
  padding: 0 4px;
}
.details-step__privacy-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.details-step__privacy-note {
  margin: var(--spacing-s, 0.75rem) 0 0;
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
</style>
```

- [ ] **Step 4: Run — must pass.** `pnpm --filter @pinboard/philly-311 test:run DetailsStep` → 8 tests.

- [ ] **Step 5: Gates + commit.**

```bash
pnpm --filter @pinboard/philly-311 test:run && pnpm --filter @pinboard/philly-311 type-check && pnpm --filter @pinboard/philly-311 lint && pnpm --filter @pinboard/philly-311 format
git add apps/philly-311/frontend/src/pages/report/DetailsStep.vue apps/philly-311/frontend/src/pages/report/DetailsStep.test.ts
git commit -m "feat(philly-311): Details step — description floor, contact info, visibility"
```

---

## Task 4: Full verification + live smoke

**Files:** none (verification only).

- [ ] **Step 1: App gates.**

```bash
pnpm --filter @pinboard/philly-311 type-check && pnpm --filter @pinboard/philly-311 lint && pnpm --filter @pinboard/philly-311 test:run && pnpm --filter @pinboard/philly-311 build
```

- [ ] **Step 2: Monorepo gates.** `pnpm turbo run build type-check test:run` — all green; `git diff 311-staging...HEAD --stat` touches only `apps/philly-311` + docs.

- [ ] **Step 3: Live Playwright smoke** (dev server: `pnpm --filter @pinboard/philly-311 dev`):
  1. `/report` → Skip → Issue type: search "pothole", select Pothole Repair, answer required radios → Next.
  2. Location: search "1234 Market", pick → Next enables → Next.
  3. **Details:** Next disabled; type 9 chars → still disabled; extend to ≥10 → Next enables.
  4. Fill contact name/email/phone; toggle "Make this report public" on.
  5. Next → Review placeholder renders. **Back** → Details shows the description, contact
     values, and checked toggle intact (store-seeded).
  6. Console: only the known benign Pictometry `Unexpected token '<'` error; anything else fails
     the smoke.
  7. Screenshot the filled Details step for the record.

- [ ] **Step 4: Hand off** to finishing-a-development-branch (Option 1 = `--no-ff` merge to `311-staging`, nothing pushed).

---

## Definition of Done (matches the spec)

1. `/report/details` renders description + contact + visibility; Next gated on the 10-char
   trimmed floor via `useWizardValidity`.
2. `payload()` sends `private` (default true); contact remains store-only with the gap documented.
3. App + monorepo gates green; `@pinboard/ui` unchanged.
4. Playwright smoke passes on the live dev server.

## Out of scope (later)

3e Review + submit + `/report/confirmation` (incl. the `store.submit()` setup-scope `useApi`
fix); submit-side contact (parked — team whiteboarding; SSO authed path); fidelity slice;
Increment 4 (CDK/deploy).
