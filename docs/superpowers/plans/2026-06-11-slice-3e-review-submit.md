# Slice 3e — Review Step, Submit, Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the report wizard — a real Review step that summarizes the report and submits it to `POST /private/key/submit`, landing on a new `/report/confirmation` page; fixes the `store.submit()` setup-scope bug and a pre-existing `$patch` deep-merge bug in `reset()`; strips dead field-error plumbing.

**Architecture:** ReviewStep owns its Submit button (the shell already hides Next on the last step — `ReportPage.vue` is untouched). `useApi` is created at component setup with a lazily-assigned body (ImageStep's pattern) because `useApi → useAuth() → inject()` is setup-scoped. Success is recorded in a new `store.submitted` slot, which the confirmation page reads and the wizard guard checks.

**Tech Stack:** Vue 3 `<script setup>` + Pinia + vue-router; vitest + @vue/test-utils. App: `apps/philly-311/frontend`.

**Spec:** `docs/superpowers/specs/2026-06-11-slice-3e-review-submit-design.md` — read it first.

**Working directory for all commands:** `/Users/darren.mcdowell/Projects/pinboard-3/apps/philly-311/frontend` (repo root for git commands: `/Users/darren.mcdowell/Projects/pinboard-3`). Branch: `311-slice-3e-review-submit`. Test suite: `npm run test:run` (vitest). Type check: `npm run type-check`. Lint: `npm run lint`.

**Conventions that bite:**
- Every code file starts with `ABOUTME:` comment lines (see any existing file).
- Tests use `setActivePinia(createPinia())` in `beforeEach`; composables are mocked with `vi.mock` at module boundaries; the real store is always used.
- Pinia's **object-form `$patch` deep-merges plain objects** — `$patch({ customFields: {} })` does NOT clear; use the function form.
- BEM-ish scoped CSS with `var(--ui-color-*, fallback)` custom properties (copy patterns from `DetailsStep.vue` / `ReportPage.vue`).

---

### Task 1: Store — fix reset() deep-merge bug; add `submitted` + `recordSubmission`; remove `submit()` + `lastFieldErrors`

**Files:**
- Modify: `src/types/wizard.ts`
- Modify: `src/stores/reportSubmission.ts`
- Test: `src/stores/reportSubmission.test.ts`

- [ ] **Step 1: Write the failing bug-repro tests for reset()**

Add to the existing `reset` describe block in `src/stores/reportSubmission.test.ts`:

```ts
it('clears customFields and contact', () => {
  const store = useReportSubmissionStore()
  store.setQuestion('Color__c', 'Red')
  store.setContact({ name: 'Darren', email: 'd@example.com' })
  store.reset()
  expect(store.customFields).toEqual({})
  expect(store.contact).toEqual({})
})
```

- [ ] **Step 2: Run it to verify it fails — this proves the pre-existing bug**

Run: `npm run test:run -- src/stores/reportSubmission.test.ts`
Expected: FAIL — `customFields` still `{ Color__c: 'Red' }` (object-form `$patch` deep-merges; `{}` into a populated object is a no-op).
If it unexpectedly PASSES, STOP — the bug hypothesis is wrong; report back instead of proceeding.

- [ ] **Step 3: Fix reset() with the function-form $patch**

In `src/stores/reportSubmission.ts` replace the body of `reset()`:

```ts
reset() {
  this.setPhoto(null)
  // Function form: the object form deep-merges plain objects, which would
  // leave customFields/contact entries behind.
  this.$patch((state) => {
    Object.assign(state, initial())
  })
},
```

- [ ] **Step 4: Run the file's tests to verify they pass**

Run: `npm run test:run -- src/stores/reportSubmission.test.ts`
Expected: PASS (the new test and all existing ones).

- [ ] **Step 5: Commit**

```bash
git -C /Users/darren.mcdowell/Projects/pinboard-3 add apps/philly-311/frontend/src/stores
git -C /Users/darren.mcdowell/Projects/pinboard-3 commit -m "fix(philly-311): reset() clears customFields/contact — \$patch object form deep-merges"
```

- [ ] **Step 6: Add types and write failing tests for recordSubmission**

In `src/types/wizard.ts`, append:

```ts
/** Fields of the POST /private/key/submit success response the app uses. */
export interface SubmitResponse {
  id: string
  caseNumber?: string
  status?: string
}

/** The slice of a successful submit kept for the confirmation page. */
export interface SubmittedReport {
  id: string
  caseNumber?: string
}
```

Add a new describe block to `src/stores/reportSubmission.test.ts`:

```ts
describe('recordSubmission', () => {
  it('stores the id and caseNumber', () => {
    const store = useReportSubmissionStore()
    store.recordSubmission({ id: 'a1', caseNumber: '311-0042' })
    expect(store.submitted).toEqual({ id: 'a1', caseNumber: '311-0042' })
  })

  it('clears the wizard fields, including customFields and contact', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    store.setQuestion('Severity__c', 'Deep')
    store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
    store.setDescription('Big hole in the road')
    store.setContact({ name: 'Darren' })
    store.setPrivacy(true)
    store.setPhoto({ mediaUrl: 'https://cdn.example.com/p.jpg' })
    store.recordSubmission({ id: 'a1' })
    expect(store.category).toBeNull()
    expect(store.customFields).toEqual({})
    expect(store.location).toBeNull()
    expect(store.description).toBe('')
    expect(store.contact).toEqual({})
    expect(store.publicVisibility).toBe(false)
    expect(store.photo).toBeNull()
    expect(store.photoSuggestions).toEqual([])
    expect(store.isEmpty).toBe(true)
  })
})
```

And inside the existing `reset` describe block:

```ts
it('clears submitted', () => {
  const store = useReportSubmissionStore()
  store.recordSubmission({ id: 'a1' })
  store.reset()
  expect(store.submitted).toBeNull()
})
```

- [ ] **Step 7: Run to verify the new tests fail**

Run: `npm run test:run -- src/stores/reportSubmission.test.ts`
Expected: FAIL — `recordSubmission is not a function`, and a TS error for `submitted` until Step 8.

- [ ] **Step 8: Implement `submitted` + `recordSubmission`**

In `src/stores/reportSubmission.ts`:

1. Import the new types (and drop the local `SubmitResponse` interface in Step 10):
   `import type { ContactInfo, PhotoAsset, PhotoSuggestion, SubmitPayload, SubmittedReport, WizardLocation } from '@/types/wizard'`
2. In `interface State`: add `submitted: SubmittedReport | null` (keep `lastFieldErrors` for now — it goes in Step 10).
3. In `initial()`: add `submitted: null,`
4. Add the action (next to `reset()`):

```ts
/** Record a successful submit and clear the wizard for a fresh report. */
recordSubmission(result: SubmittedReport) {
  this.setPhoto(null)
  this.$patch((state) => {
    Object.assign(state, initial(), { submitted: result })
  })
},
```

- [ ] **Step 9: Run to verify they pass**

Run: `npm run test:run -- src/stores/reportSubmission.test.ts`
Expected: PASS.

- [ ] **Step 10: Remove `submit()` and `lastFieldErrors`**

In `src/stores/reportSubmission.ts`:
- Delete the whole `async submit()` action.
- Delete `lastFieldErrors` from `State` and from `initial()`.
- Delete the local `interface SubmitResponse` block and the `import { useApi } from '@/composables/useApi'` line (both now unused).

In `src/stores/reportSubmission.test.ts`:
- Delete the entire `describe('submit', …)` block (currently ~lines 387-449).
- Delete the reset test `it('clears lastFieldErrors', …)` (~lines 199-204).
- Delete any now-unused imports/mocks that only served those tests (e.g. the `useApi` mock and `ApiError` import — check the top of the file; remove only what is now unreferenced).

This deletes an implementation and its tests **per the approved spec, decision 1 and section 3** (Darren explicitly approved removing the broken `submit()` and all fieldErrors plumbing).

- [ ] **Step 11: Run the full suite + type check**

Run: `npm run test:run && npm run type-check`
Expected: all tests pass; no TS errors. (Nothing else references `store.submit`/`lastFieldErrors` — verify with `grep -rn "store.submit\|lastFieldErrors" src/` → only hits should be gone.)

- [ ] **Step 12: Commit**

```bash
git -C /Users/darren.mcdowell/Projects/pinboard-3 add apps/philly-311/frontend/src
git -C /Users/darren.mcdowell/Projects/pinboard-3 commit -m "feat(philly-311): store records submissions; drop setup-scope-broken submit() and lastFieldErrors"
```

---

### Task 2: useApiError — drop `fieldErrors`, handle the Salesforce object error shape

**Files:**
- Modify: `src/composables/useApiError.ts`
- Test: `src/composables/useApiError.test.ts`
- Test: `src/composables/useApi.test.ts` (one test references fieldErrors)

The API returns `{ error: string }` for validation failures and `{ error: { message, detail } }` for Salesforce failures (see spec, Backend contract). `fieldErrors` does not exist anywhere in the API; the current parsing of it is dead code. The current `body.error ?? body.message` would set an **object** as the message for the Salesforce shape.

- [ ] **Step 1: Rewrite the tests to match the real contract**

Replace `src/composables/useApiError.test.ts` content with:

```ts
// ABOUTME: Verifies ApiError carries status and message.
// ABOUTME: Verifies parseError handles string and Salesforce object error shapes.
import { describe, expect, it } from 'vitest'
import { ApiError, parseError } from './useApiError'

describe('ApiError', () => {
  it('exposes status and message', () => {
    const e = new ApiError(400, 'Validation failed')
    expect(e.status).toBe(400)
    expect(e.message).toBe('Validation failed')
    expect(e.name).toBe('ApiError')
    expect(e instanceof Error).toBe(true)
  })
})

describe('parseError', () => {
  it('parses string errors ({error: string})', async () => {
    const r = new Response(JSON.stringify({ error: 'serviceRequestType is required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    })
    const e = await parseError(r)
    expect(e.status).toBe(400)
    expect(e.message).toBe('serviceRequestType is required')
  })

  it('parses Salesforce object errors ({error: {message, detail}}), joining detail', async () => {
    const r = new Response(
      JSON.stringify({
        error: { message: 'Salesforce error', detail: 'Required fields are missing: [Street__c]' },
      }),
      { status: 400, headers: { 'content-type': 'application/json' } },
    )
    const e = await parseError(r)
    expect(e.message).toBe('Salesforce error — Required fields are missing: [Street__c]')
  })

  it('uses message alone when the object error has no detail', async () => {
    const r = new Response(JSON.stringify({ error: { message: 'Salesforce error' } }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    })
    const e = await parseError(r)
    expect(e.message).toBe('Salesforce error')
  })

  it('falls back to body.message when body.error is missing', async () => {
    const r = new Response(JSON.stringify({ message: 'something went wrong' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
    const e = await parseError(r)
    expect(e.message).toBe('something went wrong')
  })

  it('uses statusText when both error and message are missing', async () => {
    const r = new Response(JSON.stringify({ irrelevant: 'data' }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'content-type': 'application/json' },
    })
    const e = await parseError(r)
    expect(e.message).toBe('Service Unavailable')
  })

  it('reads non-JSON responses as plain text', async () => {
    const r = new Response('Bad gateway plain text', { status: 502 })
    const e = await parseError(r)
    expect(e.status).toBe(502)
    expect(e.message).toBe('Bad gateway plain text')
  })

  it('falls back to statusText when text() is unreadable', async () => {
    // Construct a Response, pre-consume the body to make .text() reject.
    const r = new Response('payload', { status: 504, statusText: 'Gateway Timeout' })
    await r.text() // body now consumed
    const e = await parseError(r)
    expect(e.message).toBe('Gateway Timeout')
  })
})
```

(The string/fallback/non-JSON tests are kept from the existing file; the fieldErrors tests are removed per the approved spec; the object-shape tests are new.)

Also rewrite the one fieldErrors-coupled test in `src/composables/useApi.test.ts` —
"parses non-OK responses as ApiError" (~lines 165-176) builds a response body containing
`fieldErrors` and asserts `error.value?.fieldErrors?.Description`. Narrow it to the surviving
contract: keep the test, body becomes `{ error: 'Validation failed' }`, assertions become
`error.value?.status` and `error.value?.message` only. This rewrite (not deletion) of an
existing test is authorized by the approved spec's "Dead code removal" section.

- [ ] **Step 2: Run to verify the new tests fail**

Run: `npm run test:run -- src/composables/useApiError.test.ts src/composables/useApi.test.ts`
Expected: FAIL — the two object-shape tests get the statusText fallback instead of the
Salesforce message (current code sets `body.error ?? body.message`, an object). The kept
string/fallback tests and the rewritten useApi test still pass against the current code —
that's fine; only the object-shape tests must be red here.

- [ ] **Step 3: Implement**

Replace `src/composables/useApiError.ts` content with:

```ts
// ABOUTME: Typed error class for API responses + a parser that extracts status and
// ABOUTME: message from {error: string} and Salesforce {error: {message, detail}} bodies.

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/** API validation errors are `{error: string}`; Salesforce failures are `{error: {message, detail}}`. */
function errorMessage(body: { error?: unknown; message?: unknown }): string | null {
  const err = body.error
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    const { message, detail } = err as { message?: string; detail?: string }
    if (message && detail) return `${message} — ${detail}`
    return message ?? detail ?? null
  }
  return typeof body.message === 'string' ? body.message : null
}

export async function parseError(r: Response): Promise<ApiError> {
  const ct = r.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    try {
      const body = await r.json()
      return new ApiError(r.status, errorMessage(body) ?? r.statusText)
    } catch {
      // fall through to text path
    }
  }
  const text = await r.text().catch(() => r.statusText)
  return new ApiError(r.status, text || r.statusText)
}
```

- [ ] **Step 4: Run the full suite + grep for stragglers**

Run: `npm run test:run && npm run type-check && grep -rn "fieldErrors" src/`
Expected: tests pass, no TS errors, grep finds **nothing**. (Other `ApiError` constructor call sites — `useApi.ts` lines 40/64 — already pass two args.)

- [ ] **Step 5: Commit**

```bash
git -C /Users/darren.mcdowell/Projects/pinboard-3 add apps/philly-311/frontend/src/composables
git -C /Users/darren.mcdowell/Projects/pinboard-3 commit -m "feat(philly-311): parseError handles Salesforce object errors; drop fieldErrors dead code"
```

---

### Task 3: ReviewSummary component

**Files:**
- Create: `src/components/wizard/ReviewSummary.vue`
- Test: `src/components/wizard/ReviewSummary.test.ts`

Read-only summary of the store, four sections, each with an Edit `RouterLink`. Question labels come from the cached `useServiceTypes()` catalog (`src/composables/useServiceTypes.ts`); rows follow catalog question order, unknown keys go last with the raw field key as label.

- [ ] **Step 1: Write the failing tests**

Create `src/components/wizard/ReviewSummary.test.ts`:

```ts
// ABOUTME: Tests for ReviewSummary — section rendering, em-dash fallbacks,
// ABOUTME: catalog-ordered question labels, and Edit links per section.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import type { ServiceType } from '@/types/api'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

const list = ref<ServiceType[] | null>(null)
const load = vi.fn()
vi.mock('@/composables/useServiceTypes', () => ({
  useServiceTypes: () => ({ list, load, isLoading: ref(false), error: ref(null) }),
}))

import ReviewSummary from './ReviewSummary.vue'

const RouterLinkStub = {
  template: '<a :href="String(to)" class="router-link-stub"><slot /></a>',
  props: ['to'],
}

function mountSummary() {
  return mount(ReviewSummary, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

function catalogEntry(): ServiceType {
  return {
    serviceType: 'Abandoned Vehicle',
    caseType: 'Abandoned Vehicle',
    description: '',
    recordTypeID: 'rt1',
    department: 'Streets',
    questions: [
      {
        field: 'Body_Style__c',
        label: 'Body Style',
        type: 'picklist',
        required: true,
        options: ['Sedan'],
      },
      { field: 'Color__c', label: 'Color', type: 'text', required: false },
    ],
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  list.value = null
  load.mockClear()
})

describe('ReviewSummary - sections and fallbacks', () => {
  it('shows em-dashes for an empty store', () => {
    const w = mountSummary()
    // photo, category, location placeholders
    expect(w.text()).toContain('—')
    expect(w.find('img').exists()).toBe(false)
  })

  it('loads the service-type catalog on mount', () => {
    mountSummary()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('renders the photo thumbnail, preferring previewUrl', () => {
    const store = useReportSubmissionStore()
    store.setPhoto({ mediaUrl: 'https://cdn.test/p.jpg', previewUrl: 'blob:preview' })
    const w = mountSummary()
    expect(w.find('img').attributes('src')).toBe('blob:preview')
  })

  it('falls back to mediaUrl when there is no previewUrl', () => {
    useReportSubmissionStore().setPhoto({ mediaUrl: 'https://cdn.test/p.jpg' })
    const w = mountSummary()
    expect(w.find('img').attributes('src')).toBe('https://cdn.test/p.jpg')
  })

  it('renders category, description, contact, and visibility', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Abandoned Vehicle')
    store.setDescription('Rusty sedan on blocks')
    store.setContact({ name: 'Darren', email: 'd@example.com', phone: '215-555-0100' })
    store.setPrivacy(true)
    const w = mountSummary()
    expect(w.text()).toContain('Abandoned Vehicle')
    expect(w.text()).toContain('Rusty sedan on blocks')
    expect(w.text()).toContain('Darren')
    expect(w.text()).toContain('d@example.com')
    expect(w.text()).toContain('215-555-0100')
    expect(w.text()).toContain('Yes')
  })

  it('shows visibility No by default', () => {
    expect(mountSummary().text()).toContain('No')
  })
})

describe('ReviewSummary - location', () => {
  it('shows the address with zip in parens', () => {
    useReportSubmissionStore().setLocation({
      address: '1234 Market St',
      zipCode: '19107',
      lat: 39.95,
      lng: -75.16,
    })
    expect(mountSummary().text()).toContain('1234 Market St (19107)')
  })

  it('falls back to coordinates when the address is empty', () => {
    useReportSubmissionStore().setLocation({ address: '', lat: 39.95, lng: -75.16 })
    expect(mountSummary().text()).toContain('39.95, -75.16')
  })
})

describe('ReviewSummary - questions', () => {
  it('labels answers from the catalog, in catalog order, unknown keys last', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Abandoned Vehicle')
    // Insertion order deliberately scrambled vs catalog order.
    store.setQuestion('Mystery__c', 'huh')
    store.setQuestion('Color__c', 'Red')
    store.setQuestion('Body_Style__c', 'Sedan')
    list.value = [catalogEntry()]
    const w = mountSummary()
    const dts = w.findAll('.review-summary__answers dt').map((d) => d.text())
    expect(dts.slice(0, 3)).toEqual(['Body Style', 'Color', 'Mystery__c'])
    expect(w.text()).toContain('Sedan')
    expect(w.text()).toContain('Red')
  })

  it('falls back to raw field keys when the catalog has not loaded', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Abandoned Vehicle')
    store.setQuestion('Body_Style__c', 'Sedan')
    const w = mountSummary()
    expect(w.text()).toContain('Body_Style__c')
  })

  it('renders no answers block when there are no answers', () => {
    useReportSubmissionStore().setCategory('Abandoned Vehicle')
    const w = mountSummary()
    expect(w.find('.review-summary__answers').exists()).toBe(false)
  })
})

describe('ReviewSummary - edit links', () => {
  it('links each section to its owning step', () => {
    const hrefs = mountSummary()
      .findAll('a.router-link-stub')
      .map((a) => a.attributes('href'))
    expect(hrefs).toEqual(['/report', '/report/issue-type', '/report/location', '/report/details'])
  })
})
```

Note for the Details section markup: the Details `<dl>` must use a class other than `review-summary__answers` (the questions-ordering test selects on it). Use `review-summary__details`.

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test:run -- src/components/wizard/ReviewSummary.test.ts`
Expected: FAIL — cannot resolve `./ReviewSummary.vue`.

- [ ] **Step 3: Implement the component**

Create `src/components/wizard/ReviewSummary.vue`:

```vue
<!-- ABOUTME: Read-only summary of the report wizard store for the Review step.
     Four sections (photo, issue type + answers, location, details), each with an Edit link. -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useServiceTypes } from '@/composables/useServiceTypes'

const store = useReportSubmissionStore()
const { list, load } = useServiceTypes()
onMounted(() => {
  load()
})

const photoSrc = computed(() => store.photo?.previewUrl ?? store.photo?.mediaUrl ?? null)

/** Answered questions in catalog order, unknown fields last with the raw key as label. */
const answers = computed(() => {
  const entries = Object.entries(store.customFields)
  if (entries.length === 0) return []
  const questions = list.value?.find((s) => s.serviceType === store.category)?.questions ?? []
  const rank = new Map(questions.map((q, i) => [q.field, i]))
  const label = new Map(questions.map((q) => [q.field, q.label]))
  return entries
    .map(([field, value]) => ({
      field,
      label: label.get(field) ?? field,
      value,
      rank: rank.get(field) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort((a, b) => a.rank - b.rank)
})

const locationText = computed(() => {
  const loc = store.location
  if (!loc) return '—'
  const base = loc.address || `${loc.lat}, ${loc.lng}`
  return loc.zipCode ? `${base} (${loc.zipCode})` : base
})
</script>

<template>
  <div class="review-summary">
    <section class="review-summary__section">
      <header class="review-summary__header">
        <h2 class="review-summary__heading">Photo</h2>
        <RouterLink class="review-summary__edit" to="/report" aria-label="Edit photo">
          Edit
        </RouterLink>
      </header>
      <img
        v-if="photoSrc"
        class="review-summary__photo"
        :src="photoSrc"
        alt="Photo attached to this report"
      />
      <p v-else class="review-summary__value">—</p>
    </section>

    <section class="review-summary__section">
      <header class="review-summary__header">
        <h2 class="review-summary__heading">Issue type</h2>
        <RouterLink class="review-summary__edit" to="/report/issue-type" aria-label="Edit issue type">
          Edit
        </RouterLink>
      </header>
      <p class="review-summary__value">{{ store.category ?? '—' }}</p>
      <dl v-if="answers.length" class="review-summary__answers">
        <template v-for="a in answers" :key="a.field">
          <dt class="review-summary__dt">{{ a.label }}</dt>
          <dd class="review-summary__dd">{{ a.value }}</dd>
        </template>
      </dl>
    </section>

    <section class="review-summary__section">
      <header class="review-summary__header">
        <h2 class="review-summary__heading">Location</h2>
        <RouterLink class="review-summary__edit" to="/report/location" aria-label="Edit location">
          Edit
        </RouterLink>
      </header>
      <p class="review-summary__value">{{ locationText }}</p>
    </section>

    <section class="review-summary__section">
      <header class="review-summary__header">
        <h2 class="review-summary__heading">Details</h2>
        <RouterLink class="review-summary__edit" to="/report/details" aria-label="Edit details">
          Edit
        </RouterLink>
      </header>
      <dl class="review-summary__details">
        <dt class="review-summary__dt">Description</dt>
        <dd class="review-summary__dd">{{ store.description || '—' }}</dd>
        <dt class="review-summary__dt">Name</dt>
        <dd class="review-summary__dd">{{ store.contact.name || '—' }}</dd>
        <dt class="review-summary__dt">Email</dt>
        <dd class="review-summary__dd">{{ store.contact.email || '—' }}</dd>
        <dt class="review-summary__dt">Phone</dt>
        <dd class="review-summary__dd">{{ store.contact.phone || '—' }}</dd>
        <dt class="review-summary__dt">Public visibility</dt>
        <dd class="review-summary__dd">{{ store.publicVisibility ? 'Yes' : 'No' }}</dd>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.review-summary__section {
  border: 1px solid var(--ui-color-grey-200, #e3e3e3);
  border-radius: 8px;
  padding: var(--spacing-m, 1rem);
  margin-bottom: var(--spacing-m, 1rem);
}
.review-summary__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.review-summary__heading {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-s, 0.75rem);
}
.review-summary__edit {
  font-size: 0.875rem;
  color: var(--ui-color-primary, #0f4d90);
}
.review-summary__photo {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  object-fit: cover;
}
.review-summary__value {
  margin: 0;
}
.review-summary__answers,
.review-summary__details {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 4px var(--spacing-m, 1rem);
  margin: var(--spacing-s, 0.75rem) 0 0;
}
.review-summary__dt {
  font-weight: 600;
}
.review-summary__dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
```

- [ ] **Step 4: Run to verify they pass**

Run: `npm run test:run -- src/components/wizard/ReviewSummary.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -C /Users/darren.mcdowell/Projects/pinboard-3 add apps/philly-311/frontend/src/components/wizard
git -C /Users/darren.mcdowell/Projects/pinboard-3 commit -m "feat(philly-311): ReviewSummary — store summary with per-section edit links"
```

---

### Task 4: ReviewStep — submit wiring (setup-scope fix)

**Files:**
- Modify: `src/pages/report/ReviewStep.vue` (replaces the stub entirely — approved in spec)
- Test: create `src/pages/report/ReviewStep.test.ts`

`useApi` must be created during component setup (`useApi → useAuth() → inject()` throws outside setup). The body is assigned at submit time; `useApi.fetchData` reads `opts.body` when called (`src/composables/useApi.ts:45`). Same pattern as `src/pages/report/ImageStep.vue:20-30`.

- [ ] **Step 1: Write the failing tests**

Create `src/pages/report/ReviewStep.test.ts`:

```ts
// ABOUTME: Tests for ReviewStep — submit gating, lazy-body useApi wiring, error
// ABOUTME: display, and success recording + navigation. useApi and router are mocked.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { ApiError } from '@/composables/useApiError'

vi.mock('@/components/wizard/ReviewSummary.vue', () => ({
  default: { name: 'ReviewSummary', template: '<div data-testid="review-summary" />' },
}))

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))

const fetchData = vi.fn()
const apiError = ref<ApiError | null>(null)
const isLoading = ref(false)
const useApiMock = vi.fn(() => ({ fetchData, error: apiError, isLoading }))
vi.mock('@/composables/useApi', () => ({ useApi: (...args: unknown[]) => useApiMock(...args) }))

import ReviewStep from './ReviewStep.vue'

function fillStore() {
  const store = useReportSubmissionStore()
  store.setCategory('Abandoned Vehicle')
  store.setLocation({ address: '1234 Market St', zipCode: '19107', lat: 39.95, lng: -75.16 })
  store.setDescription('Rusty sedan on blocks')
  return store
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchData.mockReset()
  push.mockClear()
  useApiMock.mockClear()
  apiError.value = null
  isLoading.value = false
})

describe('ReviewStep - setup and gating', () => {
  it('creates the submit api during setup, not in the click handler', () => {
    fillStore()
    mount(ReviewStep)
    expect(useApiMock).toHaveBeenCalledTimes(1)
    expect(useApiMock).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/private/key/submit', method: 'POST' }),
    )
  })

  it('renders the summary and disables Submit while the store is incomplete', () => {
    const w = mount(ReviewStep)
    expect(w.find('[data-testid="review-summary"]').exists()).toBe(true)
    expect(w.find('[data-test="review-submit"]').attributes('disabled')).toBeDefined()
  })

  it('enables Submit when category, location, and description are set', () => {
    fillStore()
    const w = mount(ReviewStep)
    expect(w.find('[data-test="review-submit"]').attributes('disabled')).toBeUndefined()
  })

  it('disables Submit and relabels while loading', async () => {
    fillStore()
    const w = mount(ReviewStep)
    isLoading.value = true
    await flushPromises()
    const btn = w.find('[data-test="review-submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.text()).toBe('Submitting…')
  })
})

describe('ReviewStep - submit', () => {
  it('sends the store payload as the lazily-assigned body', async () => {
    const store = fillStore()
    // Capture before the click — success runs recordSubmission, which clears
    // the store, so payload() would throw afterwards.
    const expected = store.payload()
    fetchData.mockResolvedValue({ id: 'a1' })
    const w = mount(ReviewStep)
    await w.find('[data-test="review-submit"]').trigger('click')
    await flushPromises()
    const opts = useApiMock.mock.calls[0][0] as { body: unknown }
    expect(opts.body).toEqual(expected)
    expect(fetchData).toHaveBeenCalledTimes(1)
  })

  it('records the submission and navigates to confirmation on success', async () => {
    const store = fillStore()
    fetchData.mockResolvedValue({ id: 'a1', caseNumber: '311-0042', status: 'New' })
    const w = mount(ReviewStep)
    await w.find('[data-test="review-submit"]').trigger('click')
    await flushPromises()
    expect(store.submitted).toEqual({ id: 'a1', caseNumber: '311-0042' })
    expect(store.isEmpty).toBe(true)
    expect(push).toHaveBeenCalledWith('/report/confirmation')
  })

  it('shows the API error message and stays on failure', async () => {
    const store = fillStore()
    fetchData.mockImplementation(async () => {
      apiError.value = new ApiError(400, 'latitude must be within Philadelphia bounds (39.86-40.14)')
      return null
    })
    const w = mount(ReviewStep)
    await w.find('[data-test="review-submit"]').trigger('click')
    await flushPromises()
    const alert = w.find('[role="alert"]')
    expect(alert.text()).toContain('latitude must be within Philadelphia bounds')
    expect(push).not.toHaveBeenCalled()
    expect(store.submitted).toBeNull()
    expect(store.description).toBe('Rusty sedan on blocks')
  })

  it('falls back to a generic message when the error has no text', async () => {
    fillStore()
    fetchData.mockImplementation(async () => {
      apiError.value = new ApiError(0, '')
      return null
    })
    const w = mount(ReviewStep)
    await w.find('[data-test="review-submit"]').trigger('click')
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toBe(
      'Something went wrong submitting your report. Please try again.',
    )
  })

  it('clears a previous error on the next attempt', async () => {
    fillStore()
    fetchData.mockImplementationOnce(async () => {
      apiError.value = new ApiError(400, 'boom')
      return null
    })
    const w = mount(ReviewStep)
    await w.find('[data-test="review-submit"]').trigger('click')
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(true)
    apiError.value = null
    fetchData.mockResolvedValue({ id: 'a1' })
    await w.find('[data-test="review-submit"]').trigger('click')
    await flushPromises()
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('surfaces a payload() throw in the alert instead of an unhandled rejection', async () => {
    const store = fillStore()
    vi.spyOn(store, 'payload').mockImplementation(() => {
      throw new Error('location is required')
    })
    const w = mount(ReviewStep)
    await w.find('[data-test="review-submit"]').trigger('click')
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toBe('location is required')
    expect(fetchData).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm run test:run -- src/pages/report/ReviewStep.test.ts`
Expected: FAIL — the stub renders "Review — coming soon.", no submit button.

- [ ] **Step 3: Implement**

Replace `src/pages/report/ReviewStep.vue` content with:

```vue
<!-- ABOUTME: Wizard step 5 — review the report and submit it to the API.
     Owns the Submit button; the shell hides Next on the last step. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { useApi } from '@/composables/useApi'
import ReviewSummary from '@/components/wizard/ReviewSummary.vue'
import type { SubmitResponse } from '@/types/wizard'

const GENERIC_ERROR = 'Something went wrong submitting your report. Please try again.'

const router = useRouter()
const store = useReportSubmissionStore()

// Created at setup — useApi → useAuth() → inject() is setup-scoped. The body
// is assigned per submit; fetchData reads opts.body when called.
const submitOpts = { url: '/private/key/submit', method: 'POST', body: undefined as unknown }
const { fetchData, error: submitError, isLoading: submitting } = useApi<SubmitResponse>(submitOpts)

const errorMessage = ref<string | null>(null)
const canSubmit = computed(
  () => !!store.category && !!store.location && !!store.description && !submitting.value,
)

async function submit() {
  errorMessage.value = null
  try {
    submitOpts.body = store.payload()
  } catch (e) {
    errorMessage.value = (e as Error).message || GENERIC_ERROR
    return
  }
  const result = await fetchData()
  if (!result) {
    errorMessage.value = submitError.value?.message || GENERIC_ERROR
    return
  }
  store.recordSubmission({ id: result.id, caseNumber: result.caseNumber })
  router.push('/report/confirmation')
}
</script>

<template>
  <div class="review-step">
    <h1 class="review-step__title">Review</h1>
    <p class="review-step__intro">Check your report before submitting.</p>

    <ReviewSummary />

    <p v-if="errorMessage" class="review-step__error" role="alert">{{ errorMessage }}</p>

    <button
      type="button"
      class="review-step__submit"
      data-test="review-submit"
      :disabled="!canSubmit"
      @click="submit"
    >
      {{ submitting ? 'Submitting…' : 'Submit report' }}
    </button>
  </div>
</template>

<style scoped>
.review-step {
  max-width: 640px;
}
.review-step__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-s, 0.75rem);
}
.review-step__intro {
  margin: 0 0 var(--spacing-m, 1rem);
  color: var(--ui-color-grey-700, #4a4a4a);
}
.review-step__error {
  margin: var(--spacing-m, 1rem) 0;
  padding: var(--spacing-s, 0.75rem) var(--spacing-m, 1rem);
  border: 1px solid var(--ui-color-error, #c4122f);
  border-radius: 8px;
  color: var(--ui-color-error, #c4122f);
}
.review-step__submit {
  margin-top: var(--spacing-m, 1rem);
  padding: var(--spacing-s, 0.5rem) var(--spacing-l, 1.5rem);
  border-radius: 9999px;
  font-weight: 600;
  cursor: pointer;
  background: var(--ui-color-primary, #0f4d90);
  color: #fff;
  border: none;
}
.review-step__submit:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
```

Notes:
- The stub's `WIZARD_CAN_ADVANCE_KEY` write disappears with the stub — Review has no Next button to gate, and the previous step's `onBeforeUnmount` already resets `canAdvance` to `true`.
- `canSubmit` mirrors `payload()`'s preconditions; the `try/catch` is defense for the gap anyway.

- [ ] **Step 4: Run to verify they pass; check ReportPage tests still pass**

Run: `npm run test:run -- src/pages/report/ReviewStep.test.ts src/pages/ReportPage.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -C /Users/darren.mcdowell/Projects/pinboard-3 add apps/philly-311/frontend/src/pages/report
git -C /Users/darren.mcdowell/Projects/pinboard-3 commit -m "feat(philly-311): ReviewStep submits the report — lazy-body useApi created at setup"
```

---

### Task 5: Confirmation page, route, and guard

**Files:**
- Create: `src/pages/ReportConfirmationPage.vue`
- Create: `src/pages/ReportConfirmationPage.test.ts`
- Modify: `src/router/index.ts`
- Test: `src/router/wizardGuard.test.ts`, `src/router/routes.test.ts`

- [ ] **Step 1: Write the failing guard + route tests**

Append to `src/router/wizardGuard.test.ts` (inside the top-level describe):

```ts
it('redirects /report/confirmation to /report when nothing was submitted', () => {
  expect(wizardGuard(makeRoute('/report/confirmation'))).toBe('/report')
})
it('allows /report/confirmation after a recorded submission, with no category set', () => {
  useReportSubmissionStore().recordSubmission({ id: 'a1', caseNumber: '311-0042' })
  expect(wizardGuard(makeRoute('/report/confirmation'))).toBe(true)
})
```

Append to `src/router/routes.test.ts` (inside the describe):

```ts
it('resolves the confirmation page outside the wizard shell', () => {
  const r = makeRouter()
  const resolved = r.resolve('/report/confirmation')
  expect(resolved.matched).toHaveLength(1) // standalone — no ReportPage parent
})
```

- [ ] **Step 2: Write the failing page tests**

Create `src/pages/ReportConfirmationPage.test.ts`:

```ts
// ABOUTME: Tests for ReportConfirmationPage — reference number from store.submitted
// ABOUTME: and the report-another / finder links.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import ReportConfirmationPage from './ReportConfirmationPage.vue'

const RouterLinkStub = {
  template: '<a :href="String(to)" class="router-link-stub"><slot /></a>',
  props: ['to'],
}

function mountPage() {
  return mount(ReportConfirmationPage, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

beforeEach(() => setActivePinia(createPinia()))

describe('ReportConfirmationPage', () => {
  it('announces success and shows the case number in a status region', () => {
    useReportSubmissionStore().recordSubmission({ id: 'a1', caseNumber: '311-0042' })
    const w = mountPage()
    const status = w.find('[role="status"]')
    expect(status.text()).toContain('your report was submitted')
    expect(status.text()).toContain('311-0042')
  })

  it('falls back to the id when there is no caseNumber', () => {
    useReportSubmissionStore().recordSubmission({ id: 'a1' })
    expect(mountPage().find('[role="status"]').text()).toContain('a1')
  })

  it('links to a new report and to the finder', () => {
    useReportSubmissionStore().recordSubmission({ id: 'a1' })
    const hrefs = mountPage()
      .findAll('a.router-link-stub')
      .map((a) => a.attributes('href'))
    expect(hrefs).toEqual(['/report', '/'])
  })
})
```

- [ ] **Step 3: Run to verify they fail**

Run: `npm run test:run -- src/router src/pages/ReportConfirmationPage.test.ts`
Expected: FAIL — guard returns `'/report'` is not yet special-cased (the category gate redirects, so the no-submission test may accidentally pass — the **with-submission** test must fail), route resolves with 0 matches, page file missing.

- [ ] **Step 4: Implement page, route, and guard**

Create `src/pages/ReportConfirmationPage.vue`:

```vue
<!-- ABOUTME: Post-submit confirmation — shows the case reference number and
     CTAs to start another report or browse nearby reports. -->
<script setup lang="ts">
import { useReportSubmissionStore } from '@/stores/reportSubmission'

const store = useReportSubmissionStore()
</script>

<template>
  <div class="confirmation">
    <div class="confirmation__status" role="status">
      <h1 class="confirmation__title">Thanks — your report was submitted.</h1>
      <p v-if="store.submitted" class="confirmation__ref">
        Reference number:
        <strong>{{ store.submitted.caseNumber || store.submitted.id }}</strong>
      </p>
    </div>
    <div class="confirmation__actions">
      <RouterLink class="confirmation__cta" to="/report">Report another issue</RouterLink>
      <RouterLink class="confirmation__link" to="/">See reports near you</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.confirmation {
  max-width: 640px;
  margin: 0 auto;
  padding: var(--spacing-l, 2rem) var(--spacing-m, 1rem);
}
.confirmation__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-s, 0.75rem);
}
.confirmation__ref {
  margin: 0;
}
.confirmation__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-m, 1rem);
  margin-top: var(--spacing-l, 2rem);
}
.confirmation__cta {
  padding: var(--spacing-s, 0.5rem) var(--spacing-l, 1.5rem);
  border-radius: 9999px;
  font-weight: 600;
  background: var(--ui-color-primary, #0f4d90);
  color: #fff;
  text-decoration: none;
}
.confirmation__link {
  color: var(--ui-color-primary, #0f4d90);
}
</style>
```

In `src/router/index.ts`:

1. Add the route after the `/report` record (sibling, NOT a child):

```ts
{ path: '/report/confirmation', component: () => import('@/pages/ReportConfirmationPage.vue') },
```

2. In `wizardGuard`, right after `const store = useReportSubmissionStore()` (before the deep-link seeding):

```ts
// Confirmation is post-wizard: requires a recorded submission, skips the category gate.
if (to.path === '/report/confirmation') return store.submitted ? true : '/report'
```

- [ ] **Step 5: Run the full suite + type check**

Run: `npm run test:run && npm run type-check`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git -C /Users/darren.mcdowell/Projects/pinboard-3 add apps/philly-311/frontend/src
git -C /Users/darren.mcdowell/Projects/pinboard-3 commit -m "feat(philly-311): /report/confirmation page + submission-gated route guard"
```

---

### Task 6: bd issues for POC backport findings

**Working directory:** `/Users/darren.mcdowell/Projects/311-mobile-app/api` (the beads db lives there). These document bugs in the OLD POC (`311-mobile-app/web/webportal`) found while porting — no code changes in this task.

- [ ] **Step 1: Verify finding 3 before filing it**

Read `/Users/darren.mcdowell/Projects/311-mobile-app/web/webportal/frontend/src/stores/reportSubmission.ts` `reset()` — confirm it uses object-form `this.$patch(initial())`. If it uses something else, adjust or skip issue 3 accordingly.

- [ ] **Step 2: File the three issues**

```bash
cd /Users/darren.mcdowell/Projects/311-mobile-app/api
bd create -t task -p 2 "POC submit payload omits required 'private' field — every submit 400s" \
  -d "webportal/frontend/src/stores/reportSubmission.ts payload() builds {serviceRequestType, description, address, zipCode?, latitude, longitude, mediaUrl?, customFields?} but the API (oit-se-311-api/apps/api/submit.ts validateSubmission) requires 'private: boolean'. Every POC submit should 400 with 'private is required'. Fix: send private: !publicVisibility (the pinboard-3 port already does this — see apps/philly-311 payload())."
bd create -t task -p 2 "POC dead field-error machinery — API never returns fieldErrors" \
  -d "The API (oit-se-311-api/apps/api/submit.ts) returns 400 {error: string} (first validation failure) or {error: {message, detail}} for Salesforce errors. There is no fieldErrors object anywhere. Dead code in webportal/frontend/src: stores/reportSubmission.ts lastFieldErrors, pages/report/ReviewStep.vue fieldErrorRoute regex routing (lines ~17-30), composables useApiError fieldErrors parsing + its tests. Remove or align with the single-string contract (pinboard-3 port removed it and parses the object error shape — see its useApiError.ts)."
bd create -t bug -p 2 "POC store reset() doesn't clear customFields/contact — \$patch deep-merge" \
  -d "Pinia object-form \$patch deep-merges plain objects, so \$patch(initial()) merges {} into populated customFields/contact — a no-op; old answers and contact info survive Reset. Verified in pinboard-3 port via failing test; fix is the function form: this.\$patch((s) => Object.assign(s, initial())). File: webportal/frontend/src/stores/reportSubmission.ts reset()."
```

(Adjust issue 3's wording to what Step 1 actually found. Check `bd list` afterward to confirm all three exist.)

No commit (bd db is in the other repo and self-persists; nothing changes in pinboard-3).

---

### Task 7: Full verification + live smoke

- [ ] **Step 1: Full suite, types, lint**

In `/Users/darren.mcdowell/Projects/pinboard-3/apps/philly-311/frontend`:

Run: `npm run test:run && npm run type-check && npm run lint`
Expected: everything green, lint clean. Fix anything that isn't before proceeding.

- [ ] **Step 2: Live Playwright smoke (real dev API — files a REAL Salesforce case; Darren approved)**

Start the dev server: `npm run dev` (background) in the frontend dir. Then drive the browser (Playwright MCP) through the full wizard:

1. Go to `http://localhost:5173/report` (check the actual port in dev-server output).
2. Image step: upload a test photo → wait for classify to finish (photo band appears).
3. Next → Issue type: pick a low-impact category (e.g. via directory search), answer any required questions. Use **"Abandoned Bicycle"**-class categories if available; otherwise "Pothole Repair".
4. Next → Location: search and pick a Philadelphia address (e.g. "1400 John F Kennedy Blvd").
5. Next → Details: description **"TEST — automated smoke test of new 311 portal, please disregard/close"**; leave visibility private (unchecked).
6. Next → Review: assert every entered value appears (photo thumbnail, category, answers with human labels, address, description, contact dashes, visibility "No").
7. Click an Edit link (e.g. Details), confirm it lands on the step with values intact, navigate back to Review.
8. Submit → expect navigation to `/report/confirmation` with a real reference number displayed.
9. Click "Report another issue" → wizard is clean (empty image step, no lingering answers).
10. Reload `/report/confirmation` directly with the fresh store → expect redirect to `/report`.

Known benign console error: `Unexpected token '<'` from `@phila/phila-ui-map-core` (Pictometry) — dev-only, not ours. Any OTHER console error fails the smoke.

- [ ] **Step 3: Record the smoke result and commit any fixes**

If the smoke surfaced fixes, each fix follows TDD (failing test → fix → green) and gets its own commit.

---

### After all tasks

Final review (superpowers:requesting-code-review), then superpowers:finishing-a-development-branch — Option 1: `--no-ff` merge to `311-staging`, keep the feature branch, push nothing.
