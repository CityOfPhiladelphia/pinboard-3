# Philly 311 — Slice 3a: Wizard Shell + Image Step — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the report-wizard shell (5-step `StepIndicator` + contextual controls + nested routing) inside `PinboardShell`, with the Figma's optional **Image step** (photo → `/classify` → store `mediaUrl` + type suggestions). Steps 2–5 are placeholders.

**Architecture:** `/report` becomes a parent route whose `ReportPage` shell renders a breadcrumb, `StepIndicator`, a nested `<router-view>`, and a contextual controls footer; `canAdvance` flows step→shell via provide/inject. The Image step reuses the ported `processForClassify` + `useApi` + store. The `wizardGuard` is reworked to gate deep steps on a chosen category (not `isEmpty`) so the optional Image step can't trap the user.

**Tech Stack:** Vue 3.5, vue-router 5, Pinia (`reportSubmission` store), `@/utils/photo` (`processForClassify`), `@/composables/useApi`, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-10-philly-311-wizard-shell-design.md`

**Conventions for every task:**
- Paths relative to `pinboard-3/` root. Branch `feat/philly-311-wizard-shell` (off `311-staging`, already created).
- `APP` = `apps/philly-311/frontend`. Run filtered: `pnpm --filter @pinboard/philly-311 <script>` (`type-check`, `lint`, `test:run`, `format`).
- Prettier `semi: false, singleQuote: true, printWidth: 100` — run `format` before each commit.
- TDD per task: failing test → run (fails) → implement → run (passes) → `type-check` + `lint` → `format` → commit. Keep `test:run` fully green at every commit.
- **Scope:** only `APP/src`. Do NOT touch `@pinboard/ui` or other apps.

**Known facts (verified):**
- Store `reportSubmission` actions: `setCategory`, `setQuestion`, `setLocation`, `setPhoto({mediaUrl, previewUrl})`, `setDescription`, `setContact`, `setPrivacy`, `reset`, `submit`, `payload`. State includes `category`, `photo`, etc.; `reset()` = `setPhoto(null)` + `$patch(initial())`.
- `processForClassify(file: File): Promise<string>` (base64 JPEG data URL) from `@/utils/photo`.
- `useApi<T>({url, method, body})` → `{ data, error, isLoading, fetchData, abort }` (from `@/composables/useApi`); POST with JSON body works (store.submit uses it).
- `/classify`: `POST /private/key/classify` body `{ imgB64 }` → `{ classifications: [{serviceType, confidence, caseType}], imageUrl }`.
- Current router: flat `/report` → `ReportPage` (2b placeholder); `wizardGuard` redirects `/report/*` to `/report` when `store.isEmpty`, with a `/report` carve-out + deep-link `category`/`lat`/`lng` seeding.
- The Figma `STEPS`: `Image (/report)`, `Issue type (/report/issue-type)`, `Location (/report/location)`, `Details (/report/details)`, `Review (/report/review)`.

---

## Task 1: Store — `photoSuggestions`

**Files:** Modify `APP/src/types/wizard.ts`, `APP/src/stores/reportSubmission.ts`, `APP/src/stores/reportSubmission.test.ts`.

- [ ] **Step 1: Add the failing test** — append inside the store test's `describe`:

```ts
  it('stores and clears photo suggestions', () => {
    setActivePinia(createPinia())
    const store = useReportSubmissionStore()
    expect(store.photoSuggestions).toEqual([])
    store.setPhotoSuggestions([{ serviceType: 'Pothole Repair', confidence: 0.9 }])
    expect(store.photoSuggestions).toEqual([{ serviceType: 'Pothole Repair', confidence: 0.9 }])
    store.reset()
    expect(store.photoSuggestions).toEqual([])
  })
```
(If `setActivePinia`/`createPinia` aren't already imported in the test file, add them from `pinia`.)

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/stores/reportSubmission`

- [ ] **Step 3: Implement.**
  In `types/wizard.ts` add:
  ```ts
  /** A photo-classification suggestion from /classify (caseType dropped — unused for now). */
  export interface PhotoSuggestion {
    serviceType: string
    confidence: number
  }
  ```
  In `reportSubmission.ts`:
  - import the type: add `PhotoSuggestion` to the `import type { … } from '@/types/wizard'` list.
  - in `interface State`, add: `photoSuggestions: PhotoSuggestion[]`
  - in `initial()`, add: `photoSuggestions: [],`
  - add an action (next to `setPhoto`):
    ```ts
    setPhotoSuggestions(suggestions: PhotoSuggestion[]) {
      this.photoSuggestions = suggestions
    },
    ```
  - `reset()` already calls `$patch(initial())`, which resets `photoSuggestions` to `[]` — no change needed.
  > Leave `isEmpty` unchanged; it intentionally does not consider `photoSuggestions`.

- [ ] **Step 4: Run — expect PASS** (new + existing store tests). Then `type-check`, `lint`, `format`.
- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/types/wizard.ts apps/philly-311/frontend/src/stores/reportSubmission.ts apps/philly-311/frontend/src/stores/reportSubmission.test.ts
git commit -m "feat(philly-311): store photoSuggestions from /classify"
```

---

## Task 2: `StepIndicator.vue`

**Files:** Create `APP/src/components/wizard/StepIndicator.vue` + `StepIndicator.test.ts`.

Port the POC component (logic identical) — reskin best-effort to the Figma's numbered circles.

- [ ] **Step 1: Write the failing test** (`StepIndicator.test.ts`)

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StepIndicator from './StepIndicator.vue'

const steps = [
  { title: 'Image', path: '/report' },
  { title: 'Issue type', path: '/report/issue-type' },
  { title: 'Location', path: '/report/location' },
]

describe('StepIndicator', () => {
  it('renders all steps with the current one marked', () => {
    const w = mount(StepIndicator, { props: { steps, currentStep: 2, completedThrough: 1 } })
    expect(w.findAll('li')).toHaveLength(3)
    expect(w.text()).toContain('Issue type')
    expect(w.find('[data-state="current"]').text()).toContain('Issue type')
    expect(w.find('[data-state="done"]').text()).toContain('Image')
  })
  it('emits navigate when a completed (clickable) step is clicked', async () => {
    const w = mount(StepIndicator, { props: { steps, currentStep: 2, completedThrough: 1 } })
    await w.find('[data-state="done"] button').trigger('click')
    expect(w.emitted('navigate')?.[0]).toEqual(['/report'])
  })
  it('does not render a button for upcoming steps', () => {
    const w = mount(StepIndicator, { props: { steps, currentStep: 2, completedThrough: 1 } })
    expect(w.find('[data-state="upcoming"] button').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/components/wizard/StepIndicator`

- [ ] **Step 3: Implement.** Copy the POC `StepIndicator.vue` from
  `/Users/darren.mcdowell/Projects/311-mobile-app/web/webportal/frontend/src/components/wizard/StepIndicator.vue`
  verbatim (script + template), then in the `<style scoped>` replace the bare-dot `::before`
  treatment with numbered circles to match the Figma (a ~28px circle showing the step number;
  `done` = filled primary with a check; `current` = filled primary with the number; `upcoming` =
  outlined with the number). The script/template logic stays as-is. Keep the responsive stacking.
  Run `format` (it will reflow to `semi:false`).
  > The exact circle styling is best-effort; the test only checks the `data-state` + labels + click behavior, so prioritize those.

- [ ] **Step 4: Run — expect PASS.** Then `type-check`, `lint`, `format`.
- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/components/wizard/StepIndicator.vue apps/philly-311/frontend/src/components/wizard/StepIndicator.test.ts
git commit -m "feat(philly-311): StepIndicator — 5-step wizard progress"
```

---

## Task 3: Router restructure + placeholder steps

**Files:** Create `APP/src/pages/report/ImageStep.vue` (placeholder body for now — real content in Task 6), `IssueTypeStep.vue`, `LocationStep.vue`, `DetailsStep.vue`, `ReviewStep.vue`; modify `APP/src/router/index.ts`; modify `APP/src/router/routes.test.ts`.

> Steps 2–5 stay placeholders permanently in this slice; `ImageStep` gets a placeholder body here and its real content in Task 6 (so the router restructure can be verified independently first).

- [ ] **Step 1: Create the five step pages.** Each placeholder injects `canAdvance` and sets it true so the shell's Next works:

`ImageStep.vue` (temporary placeholder body — replaced in Task 6):
```vue
<!-- ABOUTME: Wizard step 1 — optional image upload + ML classify (real body in Task 6). -->
<script setup lang="ts">
import { inject, onMounted, type Ref } from 'vue'
const canAdvance = inject<Ref<boolean>>('wizard:canAdvance')
onMounted(() => { if (canAdvance) canAdvance.value = true })
</script>
<template>
  <div class="wizard-step"><p>Image step — coming soon.</p></div>
</template>
```
Create `IssueTypeStep.vue`, `LocationStep.vue`, `DetailsStep.vue`, `ReviewStep.vue` identically, changing the ABOUTME + the placeholder text ("Issue type — coming soon.", etc.). ABOUTME for each, e.g.:
```vue
<!-- ABOUTME: Wizard step 2 — issue type + conditional questions (placeholder; built in slice 3b). -->
```

- [ ] **Step 2: Restructure the routes.** In `router/index.ts`, replace the flat `/report` entry with a parent + children:

```ts
  {
    path: '/report',
    component: () => import('@/pages/ReportPage.vue'),
    children: [
      { path: '', component: () => import('@/pages/report/ImageStep.vue') },
      { path: 'issue-type', component: () => import('@/pages/report/IssueTypeStep.vue') },
      { path: 'location', component: () => import('@/pages/report/LocationStep.vue') },
      { path: 'details', component: () => import('@/pages/report/DetailsStep.vue') },
      { path: 'review', component: () => import('@/pages/report/ReviewStep.vue') },
    ],
  },
```
(Leave `/`, `/answers/:id`, `/auth/redirect` as they are.)

- [ ] **Step 3: Update `routes.test.ts`.** The `/report` resolution now matches 2 records (parent + index child). Replace the report assertion and add the new routes:

```ts
  it('resolves the report wizard shell + index (image) step', () => {
    const r = makeRouter()
    const resolved = r.resolve('/report')
    expect(resolved.matched).toHaveLength(2) // parent ReportPage + index ImageStep
  })
  it('resolves the wizard sub-steps', () => {
    const r = makeRouter()
    for (const p of ['/report/issue-type', '/report/location', '/report/details', '/report/review']) {
      expect(r.resolve(p).matched.length).toBeGreaterThanOrEqual(2)
    }
  })
```
(Keep the existing `/answers/:id` test.)

- [ ] **Step 4: Run — expect PASS.** `pnpm --filter @pinboard/philly-311 test:run -- src/router/routes`. Then `type-check`.
> `type-check` will still see the old `ReportPage.vue` (2b placeholder) as the parent — fine; it's replaced in Task 5. The placeholder steps render inside its current `<template>` only once Task 5 adds `<router-view>`; that's expected — the router test only checks resolution, not rendering.

- [ ] **Step 5: `lint`, `format`, commit**

```bash
git add apps/philly-311/frontend/src/pages/report apps/philly-311/frontend/src/router/index.ts apps/philly-311/frontend/src/router/routes.test.ts
git commit -m "feat(philly-311): wizard routes — /report parent + 5 step children (placeholders)"
```

---

## Task 4: Rework `wizardGuard`

**Files:** Modify `APP/src/router/index.ts` (the `wizardGuard` function); modify `APP/src/router/wizardGuard.test.ts`.

Gate deep steps on a chosen **category** (not `isEmpty`), and always allow Issue type (where category is chosen) so a skipped Image step can't trap the user.

- [ ] **Step 1: Rework the test** (`wizardGuard.test.ts`). Keep the deep-link-seeding cases but retarget POC paths (`/report/questions`) to the new flow and the gate to category. Replace the body of the `describe('wizardGuard', …)` with:

```ts
describe('wizardGuard', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('allows /report exactly without checking the store', () => {
    expect(wizardGuard(makeRoute('/report'))).toBe(true)
  })
  it('allows /report/issue-type even when the store is empty', () => {
    expect(wizardGuard(makeRoute('/report/issue-type'))).toBe(true)
  })
  it('redirects deep steps to /report when no category is chosen', () => {
    expect(wizardGuard(makeRoute('/report/location'))).toBe('/report')
    expect(wizardGuard(makeRoute('/report/details'))).toBe('/report')
  })
  it('allows deep steps once a category is set', () => {
    useReportSubmissionStore().setCategory('Pothole Repair')
    expect(wizardGuard(makeRoute('/report/location'))).toBe(true)
  })
  it('seeds category from a query param and allows', () => {
    const result = wizardGuard(makeRoute('/report/issue-type', { category: 'Pothole Repair' }))
    expect(result).toBe(true)
    expect(useReportSubmissionStore().category).toBe('Pothole Repair')
  })
  it('overwrites a different query category and clears custom fields', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Graffiti Removal')
    store.setQuestion('Color__c', 'Red')
    wizardGuard(makeRoute('/report/issue-type', { category: 'Pothole Repair' }))
    expect(store.category).toBe('Pothole Repair')
    expect(store.customFields).toEqual({})
  })
  it('preserves custom fields when the query category matches', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    store.setQuestion('Severity__c', 'Deep')
    wizardGuard(makeRoute('/report/issue-type', { category: 'Pothole Repair' }))
    expect(store.customFields).toEqual({ Severity__c: 'Deep' })
  })
  it('seeds location from lat/lng (with a category present) and allows', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    const result = wizardGuard(makeRoute('/report/location', { lat: '39.95', lng: '-75.16' }))
    expect(result).toBe(true)
    expect(store.location).toEqual({ address: '', lat: 39.95, lng: -75.16 })
  })
  it('does not seed location when lat/lng are invalid or partial', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    wizardGuard(makeRoute('/report/location', { lat: 'x', lng: '-75.16' }))
    wizardGuard(makeRoute('/report/location', { lat: '39.95' }))
    expect(store.location).toBeNull()
  })
  it('does not overwrite an existing location with query params', () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    store.setLocation({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
    wizardGuard(makeRoute('/report/location', { lat: '40.0', lng: '-76.0' }))
    expect(store.location).toEqual({ address: '1234 Main St', lat: 39.95, lng: -75.16 })
  })
  it('does not modify the store on a non-wizard route', () => {
    wizardGuard(makeRoute('/'))
    expect(useReportSubmissionStore().isEmpty).toBe(true)
  })
})
```
(Keep the `makeRoute` helper + imports already in the file; ensure `setActivePinia`/`createPinia` are imported.)

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/router/wizardGuard`

- [ ] **Step 3: Rework the guard.** In `router/index.ts`, replace the final gate of `wizardGuard` (keep the carve-out + deep-link seeding above it unchanged):

```ts
  // (unchanged: the `to.path === '/report' || !startsWith('/report/')` carve-out
  //  and the category / lat-lng deep-link seeding remain above this point)

  // Issue type is always reachable (it's where a category is chosen); Image is optional.
  if (to.path === '/report/issue-type') return true
  // Deeper steps require a chosen category.
  if (!store.category) return '/report'
  return true
```
(Remove the old `if (store.isEmpty) return '/report'` line.)

- [ ] **Step 4: Run — expect PASS.** Then `type-check`, `lint`, `format`.
- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/router/index.ts apps/philly-311/frontend/src/router/wizardGuard.test.ts
git commit -m "feat(philly-311): wizardGuard gates deep steps on category (optional Image step)"
```

---

## Task 5: `ReportPage.vue` — the wizard shell

**Files:** Modify `APP/src/pages/ReportPage.vue` (replace the 2b placeholder); create `APP/src/pages/ReportPage.test.ts`.

- [ ] **Step 1: Write the failing test** (`ReportPage.test.ts`)

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import { defineComponent } from 'vue'
import ReportPage from './ReportPage.vue'

const Stub = (text: string) =>
  defineComponent({ setup: () => () => text, template: `<div>${text}</div>` })

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/report',
        component: ReportPage,
        children: [
          { path: '', component: Stub('image-step') },
          { path: 'issue-type', component: Stub('issue-step') },
          { path: 'location', component: Stub('location-step') },
          { path: 'details', component: Stub('details-step') },
          { path: 'review', component: Stub('review-step') },
        ],
      },
    ],
  })
}

describe('ReportPage shell', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders the stepper and the active step via router-view', async () => {
    const router = makeRouter()
    router.push('/report')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()
    expect(w.text()).toContain('Image')
    expect(w.text()).toContain('Review')
    expect(w.text()).toContain('image-step')
  })

  it('shows Skip on the Image step and Back on later steps', async () => {
    const router = makeRouter()
    router.push('/report')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()
    expect(w.find('[data-test="wizard-skip"]').exists()).toBe(true)
    router.push('/report/issue-type')
    await flushPromises()
    expect(w.find('[data-test="wizard-back"]').exists()).toBe(true)
  })

  it('Next advances to the next step', async () => {
    const router = makeRouter()
    router.push('/report')
    await router.isReady()
    const w = mount(ReportPage, { global: { plugins: [router] } })
    await flushPromises()
    await w.find('[data-test="wizard-next"]').trigger('click')
    await flushPromises()
    expect(w.text()).toContain('issue-step')
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/pages/ReportPage`

- [ ] **Step 3: Implement** `ReportPage.vue` (adapt the POC shell to the Figma 5 steps + contextual controls):

```vue
<!-- ABOUTME: Report-wizard shell. Renders a breadcrumb, the StepIndicator, the active
     child step via <router-view>, and contextual Reset/Skip/Back/Next controls.
     canAdvance is provided to children; Next is disabled until a step sets it. -->
<script setup lang="ts">
import { provide, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import StepIndicator from '@/components/wizard/StepIndicator.vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

const router = useRouter()
const route = useRoute()
const store = useReportSubmissionStore()

const STEPS = [
  { title: 'Image', path: '/report' },
  { title: 'Issue type', path: '/report/issue-type' },
  { title: 'Location', path: '/report/location' },
  { title: 'Details', path: '/report/details' },
  { title: 'Review', path: '/report/review' },
]

const canAdvance = ref(true)
provide('wizard:canAdvance', canAdvance)

const currentStep = computed(() => {
  const idx = STEPS.findIndex((s) => s.path === route.path)
  return idx === -1 ? 1 : idx + 1
})
const completedThrough = computed(() => Math.max(0, currentStep.value - 1))
const isImageStep = computed(() => currentStep.value === 1)
const isLast = computed(() => currentStep.value === STEPS.length)
const prevPath = computed(() => STEPS[currentStep.value - 2]?.path ?? null)
const nextPath = computed(() => STEPS[currentStep.value]?.path ?? null)

function goPrev() {
  if (prevPath.value) router.push(prevPath.value)
}
function goNext() {
  if (canAdvance.value && nextPath.value) router.push(nextPath.value)
}
function jumpTo(path: string) {
  router.push(path)
}
function resetWizard() {
  store.reset()
  router.push('/report')
}
</script>

<template>
  <main class="wizard">
    <nav class="wizard__crumb" aria-label="Breadcrumb">
      <RouterLink to="/">Home</RouterLink> / <span>Report an issue</span>
    </nav>

    <StepIndicator
      :steps="STEPS"
      :current-step="currentStep"
      :completed-through="completedThrough"
      @navigate="jumpTo"
    />

    <section class="wizard__content">
      <RouterView />
    </section>

    <footer class="wizard__nav">
      <button
        v-if="isImageStep"
        type="button"
        class="wizard__reset"
        data-test="wizard-reset"
        @click="resetWizard"
      >
        Reset
      </button>
      <button
        v-else
        type="button"
        class="wizard__btn wizard__btn--secondary"
        data-test="wizard-back"
        :disabled="!prevPath"
        @click="goPrev"
      >
        Back
      </button>

      <div class="wizard__nav-right">
        <button
          v-if="isImageStep"
          type="button"
          class="wizard__btn wizard__btn--secondary"
          data-test="wizard-skip"
          @click="goNext"
        >
          Skip
        </button>
        <button
          v-if="!isLast"
          type="button"
          class="wizard__btn wizard__btn--primary"
          data-test="wizard-next"
          :disabled="!canAdvance || !nextPath"
          @click="goNext"
        >
          Next
        </button>
        <!-- Submit on the Review step is wired in slice 3e. -->
      </div>
    </footer>
  </main>
</template>

<style scoped>
.wizard { max-width: 980px; margin: 0 auto; padding: var(--spacing-m, 1rem); }
.wizard__crumb { font-size: 0.875rem; margin-bottom: var(--spacing-s, 0.75rem); }
.wizard__content { padding: var(--spacing-l, 2rem) 0; min-height: 320px; }
.wizard__nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-m, 1rem);
  border-top: 1px solid var(--ui-color-grey-300, #d6d6d6);
}
.wizard__nav-right { display: flex; gap: var(--spacing-s, 0.75rem); }
.wizard__btn {
  padding: var(--spacing-s, 0.5rem) var(--spacing-l, 1.5rem);
  border-radius: 9999px;
  font-weight: 600;
  cursor: pointer;
}
.wizard__btn--primary { background: var(--ui-color-primary, #0f4d90); color: #fff; border: none; }
.wizard__btn--secondary {
  background: #fff;
  color: var(--ui-color-primary, #0f4d90);
  border: 1px solid var(--ui-color-primary, #0f4d90);
}
.wizard__btn:disabled { opacity: 0.5; cursor: default; }
.wizard__reset { background: none; border: none; color: var(--ui-color-primary, #0f4d90); cursor: pointer; }
</style>
```

- [ ] **Step 4: Run — expect PASS.** Then `type-check`, `lint`, `format`.
- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/pages/ReportPage.vue apps/philly-311/frontend/src/pages/ReportPage.test.ts
git commit -m "feat(philly-311): ReportPage — wizard shell (stepper + contextual controls)"
```

---

## Task 6: `ImageStep.vue` — Figma Image step

**Files:** Modify `APP/src/pages/report/ImageStep.vue` (replace the Task-3 placeholder body); create `APP/src/pages/report/ImageStep.test.ts`.

- [ ] **Step 1: Write the failing test** (`ImageStep.test.ts`)

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

vi.mock('@/utils/photo', () => ({ processForClassify: vi.fn().mockResolvedValue('data:image/jpeg;base64,xxx') }))
const fetchData = vi.fn()
const apiError = ref<{ message: string } | null>(null)
vi.mock('@/composables/useApi', () => ({ useApi: () => ({ fetchData, error: apiError }) }))

import ImageStep from './ImageStep.vue'
import { processForClassify } from '@/utils/photo'

function selectFile(w: ReturnType<typeof mount>) {
  const input = w.find('input[type="file"]')
  const file = new File(['x'], 'p.jpg', { type: 'image/jpeg' })
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  return input.trigger('change')
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchData.mockReset()
  apiError.value = null
  ;(processForClassify as unknown as ReturnType<typeof vi.fn>).mockClear()
  if (typeof URL.createObjectURL !== 'function') {
    Object.defineProperty(URL, 'createObjectURL', { value: () => 'blob:x', configurable: true })
    Object.defineProperty(URL, 'revokeObjectURL', { value: () => {}, configurable: true })
  }
})

describe('ImageStep', () => {
  it('classifies a chosen photo and stores mediaUrl + suggestions', async () => {
    fetchData.mockResolvedValue({
      imageUrl: 'https://cdn.test/p.jpg',
      classifications: [{ serviceType: 'Pothole Repair', confidence: 0.9, caseType: 'X' }],
    })
    const w = mount(ImageStep)
    await selectFile(w)
    await flushPromises()
    expect(processForClassify).toHaveBeenCalled()
    const store = useReportSubmissionStore()
    expect(store.photo?.mediaUrl).toBe('https://cdn.test/p.jpg')
    expect(store.photoSuggestions).toEqual([{ serviceType: 'Pothole Repair', confidence: 0.9 }])
  })
  it('shows an inline error and does not throw when classify fails', async () => {
    apiError.value = { message: 'Classification failed.' }
    fetchData.mockResolvedValue(null)
    const w = mount(ImageStep)
    await selectFile(w)
    await flushPromises()
    expect(w.text()).toContain('Classification failed.')
    expect(useReportSubmissionStore().photo).toBeNull()
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/pages/report/ImageStep`

- [ ] **Step 3: Implement** `ImageStep.vue` (Figma layout + the POC classify logic):

```vue
<!-- ABOUTME: Wizard step 1 — optional photo. Upload/Camera -> processForClassify -> /classify,
     which stores the image (mediaUrl) and returns issue-type suggestions for step 2. Optional;
     Skip/Next both advance. -->
<script setup lang="ts">
import { inject, onBeforeUnmount, ref, type Ref } from 'vue'
import { processForClassify } from '@/utils/photo'
import { useApi } from '@/composables/useApi'
import { useReportSubmissionStore } from '@/stores/reportSubmission'

interface ClassifyResponse {
  classifications: { serviceType: string; confidence: number; caseType: string }[]
  imageUrl: string
}

const store = useReportSubmissionStore()
const canAdvance = inject<Ref<boolean>>('wizard:canAdvance')
if (canAdvance) canAdvance.value = true // the step is optional

const classifying = ref(false)
const errorMessage = ref('')

function makePreview(file: File): string | undefined {
  return typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : undefined
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  classifying.value = true
  errorMessage.value = ''
  const previewUrl = makePreview(file)
  try {
    const imgB64 = await processForClassify(file)
    const api = useApi<ClassifyResponse>({ url: '/private/key/classify', method: 'POST', body: { imgB64 } })
    const result = await api.fetchData()
    if (!result || api.error.value) {
      errorMessage.value = api.error.value?.message ?? 'Classification failed.'
      if (previewUrl) URL.revokeObjectURL?.(previewUrl)
      return
    }
    store.setPhoto({ mediaUrl: result.imageUrl, previewUrl })
    store.setPhotoSuggestions(
      result.classifications.map((c) => ({ serviceType: c.serviceType, confidence: c.confidence })),
    )
  } catch (err) {
    errorMessage.value = (err as Error).message ?? 'Photo processing failed.'
    if (previewUrl) URL.revokeObjectURL?.(previewUrl)
  } finally {
    classifying.value = false
  }
}

onBeforeUnmount(() => {
  /* preview URLs are owned by the store (revoked on setPhoto/reset); nothing to clean here */
})
</script>

<template>
  <div class="image-step">
    <h1 class="image-step__title">Images (optional)</h1>
    <p class="image-step__note">
      This app uses machine learning to pull location data from your photo and suggest the issue
      type to report. Do not upload any images with personal or sensitive information.
    </p>
    <p class="image-step__count">{{ store.photo ? '1/1' : '0/1' }}</p>

    <div class="image-step__zones">
      <label class="image-step__zone">
        <span class="image-step__zone-label">Upload</span>
        <input type="file" accept="image/*" :disabled="classifying" @change="onFile" />
      </label>
      <label class="image-step__zone">
        <span class="image-step__zone-label">Camera</span>
        <input type="file" accept="image/*" capture="environment" :disabled="classifying" @change="onFile" />
      </label>
    </div>

    <p v-if="classifying" class="image-step__status">Analyzing your photo…</p>
    <p v-if="store.photo" class="image-step__status">Photo added.</p>
    <p v-if="errorMessage" class="image-step__error">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.image-step { max-width: 640px; }
.image-step__title { font-size: 1.25rem; font-weight: 700; margin: 0 0 var(--spacing-s, 0.5rem); }
.image-step__note { color: var(--ui-color-grey-700, #4a4a4a); margin: 0 0 var(--spacing-s, 0.5rem); }
.image-step__count { margin: 0 0 var(--spacing-s, 0.5rem); }
.image-step__zones { display: flex; gap: var(--spacing-m, 1rem); }
.image-step__zone {
  flex: 1;
  min-height: 180px;
  border: 1px dashed var(--ui-color-grey-400, #b3b3b3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.image-step__zone input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.image-step__error { color: var(--ui-color-red, #c0392b); }
</style>
```

- [ ] **Step 4: Run — expect PASS.** Then `type-check`, `lint`, `format`.
- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/pages/report/ImageStep.vue apps/philly-311/frontend/src/pages/report/ImageStep.test.ts
git commit -m "feat(philly-311): ImageStep — optional photo upload + /classify"
```

---

## Task 7: Full verification

**Files:** none.

- [ ] **Step 1: Sanity-check `/classify` access** (optional but recommended). Verify the API-key header name in `api311.ts` (`x-api-key`), then a tiny POST to confirm the route is reachable (a 4xx validation error is fine — it proves the route + auth; a 403 means key-gating differs):
```bash
KEY=$(grep VITE_API_KEY apps/philly-311/frontend/.env.test | cut -d= -f2)
curl -s -o /dev/null -w "%{http_code}\n" -X POST -H "x-api-key: $KEY" -H "content-type: application/json" \
  --data '{"imgB64":"data:image/jpeg;base64,xxx"}' \
  "https://yw32n3h725.execute-api.us-east-1.amazonaws.com/test/private/key/classify"
```
> Note the status. If it's 403/401 (not reachable with the key), flag it — functional classify needs a working route, though the wiring is verified by tests regardless.

- [ ] **Step 2: App gates**
```bash
pnpm --filter @pinboard/philly-311 type-check   # PASS
pnpm --filter @pinboard/philly-311 lint          # exit 0
pnpm --filter @pinboard/philly-311 test:run      # all green (2b + new)
pnpm --filter @pinboard/philly-311 build         # PASS
```

- [ ] **Step 3: Monorepo no-regressions**
```bash
pnpm build && pnpm type-check && pnpm exec turbo run test:run
git diff --name-only 311-staging..HEAD -- . ':(exclude)apps/philly-311/**' ':(exclude)docs/**'   # empty
```

- [ ] **Step 4: Optional real smoke** — `pnpm dev:311`, open `/report`: the wizard shell renders (breadcrumb + 5-step stepper + Image step + Reset/Skip/Next); Skip/Next advances through the placeholder steps; the back/stepper navigation works. Stop the server.

---

## Definition of Done (matches the spec)

1. `/report` renders the wizard shell (breadcrumb + 5-step StepIndicator + step outlet + contextual controls) inside PinboardShell.
2. The Image step matches the Figma (optional upload/camera + ML note + 0/1) and classifies + stores `mediaUrl` + suggestions; Skip/Next advance.
3. The five `/report/*` routes resolve; the reworked `wizardGuard` gates Location+ on a category and never traps a user who skips Image.
4. `type-check`, `lint`, `test:run`, `build` green for `@pinboard/philly-311`.
5. `turbo run build/type-check/test:run` — no regression to oem/pc/ui; `@pinboard/ui` unchanged.

## Out of scope (later slices)

3b Issue type (consumes `photoSuggestions`), 3c Location, 3d Details, 3e Review + submit + `/report/confirmation`.
