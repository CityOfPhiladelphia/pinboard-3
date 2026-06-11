# Philly 311 — Slice 3b: Issue Type Step — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Issue type placeholder with the real step: photo-classify recommendations + a searchable caseType-grouped directory (pick view), swapping to a selected-type summary + conditional questions (questions view), with required-question Next-gating.

**Architecture:** `IssueTypeStep.vue` derives pick/questions view from `store.category` (no local phase flag) and owns validity via `useWizardValidity`. Three focused children: `TypeSuggestions` (recommendation cards), `TypeDirectory` (search + grouped list), `QuestionField` (POC port, input-type mapping). Catalog from the session-cached `useServiceTypes`.

**Tech Stack:** Vue 3.5, Pinia (`reportSubmission`), `useServiceTypes`, `utils/conditional.visibleQuestions`, `utils/fuzzy.fuzzyScore`, `utils/reportIcon.serviceTypeIconDefinition` + `utils/serviceTypeMeta.serviceTypeColor`, phila-ui form components, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-10-philly-311-issue-type-design.md`

**Conventions for every task:**
- Paths relative to `pinboard-3/` root. Branch `feat/philly-311-issue-type` (off `311-staging`, already created).
- `APP` = `apps/philly-311/frontend`. Run filtered: `pnpm --filter @pinboard/philly-311 <script>` (`type-check`, `lint`, `test:run`, `format`).
- Prettier `semi: false, singleQuote: true, printWidth: 100` — run `format` before each commit.
- TDD per task: failing test → run (fails) → implement → run (passes) → `type-check` + `lint` → `format` → commit. Keep `test:run` fully green at every commit.
- **Scope:** only `APP` (src + package.json). Do NOT touch `@pinboard/ui` or other apps.
- All new code files start with `ABOUTME: ` header lines.

**Known facts (verified):**
- `ServiceType` (`types/api.ts`): `{ serviceType, caseType, description, recordTypeID, department, questions: QuestionField[] }`. `QuestionField`: `{ field, label, type, required, options?, controllerName?, dependentValues? }`.
- `useServiceTypes()` → `{ load(): Promise<ServiceType[]|null>, list: Ref<ServiceType[]|null>, isLoading: Ref<boolean>, error: Ref<ApiError|null> }`; `load()` is session-cached.
- Store: `setCategory(cat: string|null)` clears `customFields` on change; `setQuestion(field, value)` deletes the key on empty value; `photoSuggestions: {serviceType, confidence}[]`; `photo: {mediaUrl, previewUrl?}|null`.
- `visibleQuestions(questions, answers, serviceType)` in `utils/conditional.ts` (already tested).
- `fuzzyScore(query, title, keywords): number` in `utils/fuzzy.ts` — 0 = no match.
- `serviceTypeIconDefinition(name)` in `utils/reportIcon.ts` → FontAwesome `IconDefinition` (location-dot fallback); `serviceTypeColor(name)` in `utils/serviceTypeMeta.ts` → hex. Render icons with `<FontAwesomeIcon :icon="…" />` from `@fortawesome/vue-fontawesome` — NOT yet an app dependency (only `packages/ui` has it); Task 1 adds it. It renders fine in jsdom, so tests need no stub for it.
- `data/service_types.json`: `Record<serviceTypeName, { description, keywords: string[] }>`.
- `__test__/setup.ts` ALREADY stubs `@phila/phila-ui-switch` (Switch) and `@phila/phila-ui-date-field` (DateField) plus RadioGroup/CheckboxGroup/TextField — but the app's `package.json` does NOT yet have the switch/date-field deps.
- `WIZARD_CAN_ADVANCE_KEY` + `useWizardValidity(validity: ComputedRef<boolean>)` in `composables/useWizardValidity.ts`; the shell provides the ref. `useWizardValidity` resets the ref to true via `onBeforeUnmount`.
- POC sources to port: `/Users/darren.mcdowell/Projects/311-mobile-app/web/webportal/frontend/src/components/wizard/QuestionField.vue` + `QuestionField.test.ts`.
- `pnpm install` needs the fontawesome token inline: `NPM_FONTAWESOME_SECRET=54AC7138-FFDC-4F82-BD32-332A9F91091A pnpm install` (low-security token, ships in FE bundle).

---

## Task 1: Dependencies — phila-ui switch + date-field, vue-fontawesome

**Files:**
- Modify: `apps/philly-311/frontend/package.json`
- Modify: `pnpm-lock.yaml` (generated)

- [ ] **Step 1: Add the deps.** In `APP/package.json` dependencies (alphabetical positions, match the existing pin style):

```json
    "@fortawesome/vue-fontawesome": "^3.1.2",
    "@phila/phila-ui-date-field": "^0.0.8",
    "@phila/phila-ui-switch": "^0.0.4",
```
(`vue-fontawesome` matches the `packages/ui` pin — the workspace already resolves it to 3.1.3.)

- [ ] **Step 2: Install.**

```bash
NPM_FONTAWESOME_SECRET=54AC7138-FFDC-4F82-BD32-332A9F91091A pnpm install
```
Expected: exits 0, lockfile updated.

- [ ] **Step 3: Verify imports resolve.** Quick node probe — pnpm links the deps into the APP's node_modules, not the repo root:

```bash
node -e "for (const p of ['@phila/phila-ui-switch','@phila/phila-ui-date-field','@fortawesome/vue-fontawesome']) console.log(p, require('./apps/philly-311/frontend/node_modules/' + p + '/package.json').version)"
```
Expected: prints the three versions. Then `pnpm --filter @pinboard/philly-311 test:run` — still green (setup.ts module mocks keep applying regardless).

- [ ] **Step 4: Commit**

```bash
git add apps/philly-311/frontend/package.json pnpm-lock.yaml
git commit -m "chore(philly-311): add phila-ui switch + date-field and vue-fontawesome"
```

---

## Task 2: `QuestionField.vue` — POC port

**Files:**
- Create: `apps/philly-311/frontend/src/components/wizard/QuestionField.vue`
- Create: `apps/philly-311/frontend/src/components/wizard/QuestionField.test.ts`

Read BOTH POC files first (paths in Known facts). The port DROPS the `showError` prop and all error-display machinery (per spec — the shell's disabled Next is the gate); everything else (type mapping, choices shaping, `;`-join) is logic-identical. Adapt the POC test file: copy its cases, delete the showError/error-message cases, keep per-type rendering + emit cases.

- [ ] **Step 1: Write the failing test** — port `QuestionField.test.ts` from the POC, adapted. It must cover at minimum (use the POC's structure; stubs from setup.ts render props as text):
  - `picklist` ≤4 options → RadioGroup with `groupLabel` containing the label and `*` when required; choices mapped `{text, value}`; update emits the value.
  - `picklist` >4 options → native `<select>` with all options + disabled placeholder; change emits.
  - `multipicklist` → CheckboxGroup; `modelValue` `'A;B'` → `['A','B']`; update with `['A','C']` emits `'A;C'`.
  - `textarea` → native textarea; input emits.
  - `date` → DateField stub receives label + modelValue.
  - `boolean` → Switch stub receives `ariaLabel`; update emits `'true'`/`'false'` strings.
  - `double` → TextField with `imaskProps` set.
  - default/`string` → TextField; update emits.
  - required label suffix: label ends with `*` only when `required: true`.

- [ ] **Step 2: Run — expect FAIL** (unresolved import). `pnpm --filter @pinboard/philly-311 test:run -- src/components/wizard/QuestionField`

- [ ] **Step 3: Implement** — copy the POC `QuestionField.vue`, then:
  - Remove the `showError` prop, `showRequiredError`, `errorProp`, every `:error` / `:error-message` binding, and the two native-block `<p role="alert">` error lines.
  - Keep `labelText` (asterisk), `fieldId`, the full type mapping, `data-type` attr, and the `;`-join behavior.
  - Restyle the `<style scoped>` tokens to app convention: `--Schemes-Error`→ drop (no error styles left), `--scale-50, 4px` → `--spacing-xs, 4px`. Keep `.question-field__label`.
  - ABOUTME header: keep the POC's, minus any stub-package claims that no longer hold (Switch/DateField are real deps now; SelectField/textarea remain native by design).
  - Run `format`.

- [ ] **Step 4: Run — expect PASS.** Then full `test:run`, `type-check`, `lint`, `format`.

- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/components/wizard/QuestionField.vue apps/philly-311/frontend/src/components/wizard/QuestionField.test.ts
git commit -m "feat(philly-311): QuestionField — per-type inputs for wizard questions"
```

---

## Task 3: `TypeSuggestions.vue`

**Files:**
- Create: `apps/philly-311/frontend/src/components/wizard/TypeSuggestions.vue`
- Create: `apps/philly-311/frontend/src/components/wizard/TypeSuggestions.test.ts`

- [ ] **Step 1: Write the failing test:**

```ts
// ABOUTME: Tests TypeSuggestions — confidence sort, catalog filter, top-3 cap, select emit.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TypeSuggestions from './TypeSuggestions.vue'
import type { ServiceType } from '@/types/api'

const st = (serviceType: string, description = `${serviceType} desc`): ServiceType => ({
  serviceType,
  caseType: serviceType,
  description,
  recordTypeID: 'rt',
  department: 'Dept',
  questions: [],
})
const catalog = [st('Pothole Repair'), st('Illegal Dumping'), st('Graffiti Removal'), st('Vacant Lot')]

describe('TypeSuggestions', () => {
  it('renders suggestions sorted by confidence, capped at 3, unknown types dropped', () => {
    const w = mount(TypeSuggestions, {
      props: {
        suggestions: [
          { serviceType: 'Graffiti Removal', confidence: 0.5 },
          { serviceType: 'Miscellaneous', confidence: 0.95 },
          { serviceType: 'Pothole Repair', confidence: 0.9 },
          { serviceType: 'Illegal Dumping', confidence: 0.8 },
          { serviceType: 'Vacant Lot', confidence: 0.4 },
        ],
        catalog,
      },
    })
    const items = w.findAll('button')
    expect(items.map((b) => b.text())).toHaveLength(3)
    expect(items[0].text()).toContain('Pothole Repair')
    expect(items[1].text()).toContain('Illegal Dumping')
    expect(items[2].text()).toContain('Graffiti Removal')
    expect(w.text()).not.toContain('Miscellaneous')
    expect(w.text()).toContain('AI generated recommendations')
    expect(items[0].text()).toContain('Pothole Repair desc')
  })
  it('emits select with the service type on click', async () => {
    const w = mount(TypeSuggestions, {
      props: { suggestions: [{ serviceType: 'Pothole Repair', confidence: 0.9 }], catalog },
    })
    await w.find('button').trigger('click')
    expect(w.emitted('select')?.[0]).toEqual(['Pothole Repair'])
  })
  it('renders nothing when no suggestion survives the catalog filter', () => {
    const w = mount(TypeSuggestions, {
      props: { suggestions: [{ serviceType: 'Miscellaneous', confidence: 1 }], catalog },
    })
    expect(w.find('section').exists()).toBe(false)
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/components/wizard/TypeSuggestions`

- [ ] **Step 3: Implement:**

```vue
<!-- ABOUTME: "AI generated recommendations" panel for the Issue type step — the photo-classify
     suggestions filtered to catalog membership, sorted by confidence, top 3, click to select. -->
<script setup lang="ts">
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import type { ServiceType } from '@/types/api'
import type { PhotoSuggestion } from '@/types/wizard'
import { serviceTypeIconDefinition } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'

const props = defineProps<{ suggestions: PhotoSuggestion[]; catalog: ServiceType[] }>()
const emit = defineEmits<{ select: [serviceType: string] }>()

const top = computed(() => {
  const byName = new Map(props.catalog.map((s) => [s.serviceType, s]))
  return [...props.suggestions]
    .sort((a, b) => b.confidence - a.confidence)
    .map((s) => byName.get(s.serviceType))
    .filter((s): s is ServiceType => s !== undefined)
    .slice(0, 3)
})
</script>

<template>
  <section v-if="top.length" class="type-suggestions" aria-label="AI generated recommendations">
    <h2 class="type-suggestions__title">AI generated recommendations</h2>
    <p class="type-suggestions__note">Based on objects in your photo</p>
    <ul class="type-suggestions__list">
      <li v-for="s in top" :key="s.serviceType">
        <button type="button" class="type-suggestions__card" @click="emit('select', s.serviceType)">
          <span class="type-suggestions__icon" :style="{ backgroundColor: serviceTypeColor(s.serviceType) }">
            <FontAwesomeIcon :icon="serviceTypeIconDefinition(s.serviceType)" />
          </span>
          <span class="type-suggestions__body">
            <span class="type-suggestions__name">{{ s.serviceType }}</span>
            <span class="type-suggestions__desc">{{ s.description }}</span>
          </span>
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.type-suggestions {
  border: 1px solid var(--ui-color-grey-300, #d6d6d6);
  border-radius: 8px;
  padding: var(--spacing-m, 1rem);
  background: var(--ui-color-grey-100, #f5f5f5);
}
.type-suggestions__title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}
.type-suggestions__note {
  margin: 0 0 var(--spacing-s, 0.75rem);
  color: var(--ui-color-grey-700, #4a4a4a);
  font-size: 0.875rem;
}
.type-suggestions__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-s, 0.75rem);
}
.type-suggestions__card {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  width: 100%;
  text-align: left;
  background: #fff;
  border: 1px solid var(--ui-color-primary, #0f4d90);
  border-radius: 8px;
  padding: var(--spacing-s, 0.75rem);
  cursor: pointer;
}
.type-suggestions__card:hover,
.type-suggestions__card:focus-visible {
  outline: 2px solid var(--ui-color-primary, #0f4d90);
  outline-offset: 1px;
}
.type-suggestions__icon {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.type-suggestions__body {
  display: flex;
  flex-direction: column;
}
.type-suggestions__name {
  font-weight: 700;
}
.type-suggestions__desc {
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
</style>
```

> `@fortawesome/vue-fontawesome` was added in Task 1 and renders fine in jsdom — no test stub needed. Do not add one to `setup.ts`.

- [ ] **Step 4: Run — expect PASS.** Then full `test:run`, `type-check`, `lint`, `format`.
- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/components/wizard/TypeSuggestions.vue apps/philly-311/frontend/src/components/wizard/TypeSuggestions.test.ts
git commit -m "feat(philly-311): TypeSuggestions — photo-classify recommendation cards"
```

---

## Task 4: `TypeDirectory.vue`

**Files:**
- Create: `apps/philly-311/frontend/src/components/wizard/TypeDirectory.vue`
- Create: `apps/philly-311/frontend/src/components/wizard/TypeDirectory.test.ts`

- [ ] **Step 1: Write the failing test:**

```ts
// ABOUTME: Tests TypeDirectory — caseType grouping, fuzzy search incl. keywords, select emit.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TypeDirectory from './TypeDirectory.vue'
import type { ServiceType } from '@/types/api'

const st = (serviceType: string, caseType: string, description = `${serviceType} desc`): ServiceType => ({
  serviceType,
  caseType,
  description,
  recordTypeID: 'rt',
  department: 'Dept',
  questions: [],
})
const catalog = [
  st('Pothole Repair', 'Street Defect'),
  st('Cave-In Repair', 'Street Defect', 'Road surface dropped suddenly'),
  st('ADA Curb Ramp', 'Dangerous Sidewalk'),
  st('Graffiti Removal', 'Graffiti Removal'),
]

describe('TypeDirectory', () => {
  it('groups by caseType with groups and members sorted A–Z', () => {
    const w = mount(TypeDirectory, { props: { catalog } })
    const headings = w.findAll('h3').map((h) => h.text())
    expect(headings).toEqual(['Dangerous Sidewalk', 'Graffiti Removal', 'Street Defect'])
    const streetDefect = w.findAll('li button').map((b) => b.text())
    expect(streetDefect.join(' ')).toContain('Cave-In Repair')
    expect(w.text()).toContain('Pothole Repair desc')
    expect(w.text()).toContain('Road surface dropped suddenly')
  })
  it('filters by fuzzy match on name and drops emptied groups', async () => {
    const w = mount(TypeDirectory, { props: { catalog } })
    await w.find('input[type="search"]').setValue('pothole')
    expect(w.text()).toContain('Pothole Repair')
    expect(w.text()).not.toContain('Graffiti Removal')
    expect(w.findAll('h3').map((h) => h.text())).toEqual(['Street Defect'])
  })
  it('matches via keywords from service_types.json', async () => {
    const w = mount(TypeDirectory, { props: { catalog } })
    await w.find('input[type="search"]').setValue('wheelchair')
    expect(w.text()).toContain('ADA Curb Ramp')
    expect(w.text()).not.toContain('Pothole Repair')
  })
  it('matches on description substrings', async () => {
    const w = mount(TypeDirectory, { props: { catalog } })
    await w.find('input[type="search"]').setValue('dropped suddenly')
    expect(w.text()).toContain('Cave-In Repair')
    expect(w.text()).not.toContain('Pothole Repair')
  })
  it('shows an empty message when nothing matches', async () => {
    const w = mount(TypeDirectory, { props: { catalog } })
    await w.find('input[type="search"]').setValue('zzzzz')
    expect(w.text()).toContain('No issue types match your search.')
    expect(w.findAll('h3')).toHaveLength(0)
  })
  it('emits select with the service type on row click', async () => {
    const w = mount(TypeDirectory, { props: { catalog } })
    const row = w.findAll('li button').find((b) => b.text().includes('Graffiti Removal'))!
    await row.trigger('click')
    expect(w.emitted('select')?.[0]).toEqual(['Graffiti Removal'])
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/components/wizard/TypeDirectory`

- [ ] **Step 3: Implement:**

```vue
<!-- ABOUTME: "All issue types" directory for the Issue type step — fuzzy search over name,
     description, and keywords; caseType-grouped two-column rows; click to select. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import type { ServiceType } from '@/types/api'
import { fuzzyScore } from '@/utils/fuzzy'
import { serviceTypeIconDefinition } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'
import serviceTypeInfo from '@/data/service_types.json'

const props = defineProps<{ catalog: ServiceType[] }>()
const emit = defineEmits<{ select: [serviceType: string] }>()

const query = ref('')

const INFO = serviceTypeInfo as Record<string, { description: string; keywords: string[] }>

function matches(s: ServiceType): boolean {
  const q = query.value.trim()
  if (!q) return true
  if (fuzzyScore(q, s.serviceType, INFO[s.serviceType]?.keywords ?? []) > 0) return true
  return s.description.toLowerCase().includes(q.toLowerCase())
}

const groups = computed(() => {
  const byCase = new Map<string, ServiceType[]>()
  for (const s of props.catalog) {
    if (!matches(s)) continue
    const list = byCase.get(s.caseType) ?? []
    list.push(s)
    byCase.set(s.caseType, list)
  }
  return [...byCase.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([caseType, items]) => ({
      caseType,
      items: [...items].sort((a, b) => a.serviceType.localeCompare(b.serviceType)),
    }))
})
</script>

<template>
  <div class="type-directory">
    <label class="type-directory__search-label" for="type-search">Search issue types</label>
    <input
      id="type-search"
      v-model="query"
      type="search"
      class="type-directory__search"
      placeholder="Search"
    />

    <p v-if="!groups.length" class="type-directory__empty">No issue types match your search.</p>

    <section v-for="group in groups" :key="group.caseType" class="type-directory__group">
      <h3 class="type-directory__heading">{{ group.caseType }}</h3>
      <ul class="type-directory__list">
        <li v-for="s in group.items" :key="s.serviceType">
          <button type="button" class="type-directory__row" @click="emit('select', s.serviceType)">
            <span class="type-directory__icon" :style="{ backgroundColor: serviceTypeColor(s.serviceType) }">
              <FontAwesomeIcon :icon="serviceTypeIconDefinition(s.serviceType)" />
            </span>
            <span class="type-directory__body">
              <span class="type-directory__name">{{ s.serviceType }}</span>
              <span class="type-directory__desc">{{ s.description }}</span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.type-directory__search-label {
  display: block;
  font-weight: 600;
  margin-bottom: var(--spacing-xs, 0.25rem);
}
.type-directory__search {
  width: 100%;
  max-width: 480px;
  padding: var(--spacing-s, 0.5rem);
  border: 1px solid var(--ui-color-grey-400, #b3b3b3);
  border-radius: 4px;
  margin-bottom: var(--spacing-m, 1rem);
}
.type-directory__heading {
  font-size: 1.125rem;
  font-weight: 700;
  margin: var(--spacing-m, 1rem) 0 var(--spacing-xs, 0.25rem);
}
.type-directory__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: var(--spacing-l, 2rem);
}
.type-directory__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid var(--ui-color-grey-300, #d6d6d6);
  padding: var(--spacing-s, 0.75rem) 0;
  cursor: pointer;
}
.type-directory__row:hover .type-directory__name,
.type-directory__row:focus-visible .type-directory__name {
  text-decoration: underline;
}
.type-directory__icon {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.type-directory__body {
  display: flex;
  flex-direction: column;
}
.type-directory__name {
  font-weight: 700;
  color: var(--ui-color-primary, #0f4d90);
}
.type-directory__desc {
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
.type-directory__empty {
  color: var(--ui-color-grey-700, #4a4a4a);
}
@media (max-width: 768px) {
  .type-directory__list {
    grid-template-columns: 1fr;
  }
}
</style>
```

> The keyword test relies on the real `data/service_types.json` having `"wheelchair"` under `ADA Curb Ramp` — verified true. If `resolveJsonModule` complains, mirror how `utils/reportIcon.ts` imports its JSON (it already does this).

- [ ] **Step 4: Run — expect PASS.** Then full `test:run`, `type-check`, `lint`, `format`.
- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/components/wizard/TypeDirectory.vue apps/philly-311/frontend/src/components/wizard/TypeDirectory.test.ts
git commit -m "feat(philly-311): TypeDirectory — searchable caseType-grouped issue list"
```

---

## Task 5: `IssueTypeStep.vue` — orchestrator

**Files:**
- Modify: `apps/philly-311/frontend/src/pages/report/IssueTypeStep.vue` (replace the placeholder entirely)
- Create: `apps/philly-311/frontend/src/pages/report/IssueTypeStep.test.ts`

- [ ] **Step 1: Write the failing test:**

```ts
// ABOUTME: Tests IssueTypeStep — pick/questions view swap, validity gating, Change reset,
// ABOUTME: conditional follow-ups, zero-question types, catalog error retry, suggestions band.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import type { ServiceType } from '@/types/api'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { WIZARD_CAN_ADVANCE_KEY } from '@/composables/useWizardValidity'

const CATALOG: ServiceType[] = [
  {
    serviceType: 'Pothole Repair',
    caseType: 'Street Defect',
    description: 'Pothole in the road',
    recordTypeID: 'rt1',
    department: 'Streets',
    questions: [
      { field: 'Severity__c', label: 'Severity', type: 'picklist', required: true, options: ['Shallow', 'Deep'] },
      {
        field: 'Depth__c',
        label: 'Depth detail',
        type: 'string',
        required: false,
        controllerName: 'Severity__c',
        dependentValues: { a: ['Deep'] },
      },
    ],
  },
  {
    serviceType: 'Graffiti Removal',
    caseType: 'Graffiti Removal',
    description: 'Graffiti on property',
    recordTypeID: 'rt2',
    department: 'CLIP',
    questions: [],
  },
]

const list = ref<ServiceType[] | null>(CATALOG)
const isLoading = ref(false)
const error = ref<{ message: string } | null>(null)
const load = vi.fn().mockResolvedValue(CATALOG)
vi.mock('@/composables/useServiceTypes', () => ({
  useServiceTypes: () => ({ list, isLoading, error, load }),
}))

import IssueTypeStep from './IssueTypeStep.vue'

function mountStep(canAdvance = ref(false)) {
  const w = mount(IssueTypeStep, {
    global: { provide: { [WIZARD_CAN_ADVANCE_KEY]: canAdvance } },
  })
  return { w, canAdvance }
}

beforeEach(() => {
  setActivePinia(createPinia())
  list.value = CATALOG
  isLoading.value = false
  error.value = null
  load.mockClear()
})

describe('IssueTypeStep', () => {
  it('shows the pick view (directory, no suggestions) when no category and no photo', () => {
    const { w } = mountStep()
    expect(w.text()).toContain('Issue type')
    expect(w.text()).toContain('All issue types')
    expect(w.text()).toContain('Pothole Repair')
    expect(w.text()).not.toContain('AI generated recommendations')
  })
  it('shows suggestions when a photo and surviving suggestions exist', () => {
    const store = useReportSubmissionStore()
    store.setPhoto({ mediaUrl: 'https://cdn.test/p.jpg', previewUrl: 'blob:x' })
    store.setPhotoSuggestions([{ serviceType: 'Pothole Repair', confidence: 0.9 }])
    const { w } = mountStep()
    expect(w.text()).toContain('AI generated recommendations')
    expect(w.find('img').attributes('src')).toBe('blob:x')
  })
  it('selecting from the directory writes the store and swaps to questions', async () => {
    const { w } = mountStep()
    const row = w.findAll('button').find((b) => b.text().includes('Pothole Repair'))!
    await row.trigger('click')
    expect(useReportSubmissionStore().category).toBe('Pothole Repair')
    expect(w.text()).toContain('Severity')
    expect(w.text()).not.toContain('All issue types')
  })
  it('gates canAdvance on required visible questions', async () => {
    const store = useReportSubmissionStore()
    const { w, canAdvance } = mountStep()
    store.setCategory('Pothole Repair')
    await flushPromises()
    expect(canAdvance.value).toBe(false)
    store.setQuestion('Severity__c', 'Shallow')
    await flushPromises()
    expect(canAdvance.value).toBe(true)
    expect(w.text()).toContain('* Required')
  })
  it('reveals conditional follow-ups when the controller answer matches', async () => {
    const store = useReportSubmissionStore()
    const { w } = mountStep()
    store.setCategory('Pothole Repair')
    await flushPromises()
    expect(w.text()).not.toContain('Depth detail')
    store.setQuestion('Severity__c', 'Deep')
    await flushPromises()
    expect(w.text()).toContain('Depth detail')
  })
  it('zero-question types advance immediately with a no-details message', async () => {
    const store = useReportSubmissionStore()
    const { w, canAdvance } = mountStep()
    store.setCategory('Graffiti Removal')
    await flushPromises()
    expect(canAdvance.value).toBe(true)
    expect(w.text()).toContain('No additional details needed')
  })
  it('Change returns to the pick view and clears answers', async () => {
    const store = useReportSubmissionStore()
    store.setCategory('Pothole Repair')
    store.setQuestion('Severity__c', 'Deep')
    const { w } = mountStep()
    await w.find('[data-test="change-type"]').trigger('click')
    expect(store.category).toBeNull()
    expect(store.customFields).toEqual({})
    expect(w.text()).toContain('All issue types')
  })
  it('catalog error shows a retry that re-calls load', async () => {
    list.value = null
    error.value = { message: 'boom' }
    const { w } = mountStep()
    expect(w.text()).toContain('boom')
    await w.find('[data-test="retry-types"]').trigger('click')
    expect(load).toHaveBeenCalledTimes(2) // mount + retry
  })
})
```

- [ ] **Step 2: Run — expect FAIL.** `pnpm --filter @pinboard/philly-311 test:run -- src/pages/report/IssueTypeStep`

- [ ] **Step 3: Implement** (replace the placeholder file entirely):

```vue
<!-- ABOUTME: Wizard step 2 — choose the issue type (photo recommendations + searchable
     caseType-grouped directory) and answer its conditional questions. View derives from
     store.category; Next is gated on required visible questions via useWizardValidity. -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useServiceTypes } from '@/composables/useServiceTypes'
import { useWizardValidity } from '@/composables/useWizardValidity'
import { useReportSubmissionStore } from '@/stores/reportSubmission'
import { visibleQuestions } from '@/utils/conditional'
import { serviceTypeIconDefinition } from '@/utils/reportIcon'
import { serviceTypeColor } from '@/utils/serviceTypeMeta'
import TypeSuggestions from '@/components/wizard/TypeSuggestions.vue'
import TypeDirectory from '@/components/wizard/TypeDirectory.vue'
import QuestionField from '@/components/wizard/QuestionField.vue'

const store = useReportSubmissionStore()
const { list, isLoading, error, load } = useServiceTypes()
onMounted(() => {
  void load()
})
function retry() {
  void load()
}

const catalog = computed(() => list.value ?? [])
const selected = computed(
  () => catalog.value.find((s) => s.serviceType === store.category) ?? null,
)
const visible = computed(() =>
  selected.value
    ? visibleQuestions(selected.value.questions, store.customFields, selected.value.serviceType)
    : [],
)
const hasRequired = computed(() => visible.value.some((q) => q.required))

useWizardValidity(
  computed(
    () =>
      !!store.category &&
      visible.value.every((q) => !q.required || (store.customFields[q.field] ?? '') !== ''),
  ),
)

function pick(serviceType: string) {
  store.setCategory(serviceType)
}
function change() {
  store.setCategory(null)
}
</script>

<template>
  <div class="issue-step">
    <h1 class="issue-step__title">Issue type <span class="issue-step__required">* (required)</span></h1>

    <p v-if="isLoading && !catalog.length" class="issue-step__status">Loading issue types…</p>
    <p v-else-if="error" class="issue-step__error" role="alert">
      {{ error.message || 'Could not load issue types.' }}
      <button type="button" data-test="retry-types" class="issue-step__retry" @click="retry">
        Retry
      </button>
    </p>

    <template v-else-if="!store.category">
      <div v-if="store.photo" class="issue-step__photo-band">
        <img
          class="issue-step__photo"
          :src="store.photo.previewUrl ?? store.photo.mediaUrl"
          alt="Your uploaded photo"
        />
        <TypeSuggestions
          :suggestions="store.photoSuggestions"
          :catalog="catalog"
          @select="pick"
        />
      </div>

      <h2 class="issue-step__subhead">All issue types</h2>
      <TypeDirectory :catalog="catalog" @select="pick" />
    </template>

    <template v-else>
      <div class="issue-step__selected">
        <span
          class="issue-step__selected-icon"
          :style="{ backgroundColor: serviceTypeColor(store.category) }"
        >
          <FontAwesomeIcon :icon="serviceTypeIconDefinition(store.category)" />
        </span>
        <span class="issue-step__selected-body">
          <span class="issue-step__selected-name">{{ store.category }}</span>
          <span v-if="selected" class="issue-step__selected-desc">{{ selected.description }}</span>
        </span>
        <button type="button" data-test="change-type" class="issue-step__change" @click="change">
          Change
        </button>
      </div>

      <p v-if="!visible.length" class="issue-step__status">
        No additional details needed for this issue type.
      </p>
      <template v-else>
        <p v-if="hasRequired" class="issue-step__legend">* Required</p>
        <div class="issue-step__questions">
          <QuestionField
            v-for="q in visible"
            :key="q.field"
            :question="q"
            :model-value="store.customFields[q.field] ?? ''"
            @update:model-value="store.setQuestion(q.field, $event)"
          />
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.issue-step__title {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-m, 1rem);
}
.issue-step__required {
  font-weight: 400;
  color: var(--ui-color-grey-700, #4a4a4a);
  font-size: 1rem;
}
.issue-step__photo-band {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--spacing-m, 1rem);
  margin-bottom: var(--spacing-l, 2rem);
}
.issue-step__photo {
  width: 100%;
  max-height: 360px;
  object-fit: cover;
  border-radius: 8px;
}
.issue-step__subhead {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-s, 0.75rem);
}
.issue-step__selected {
  display: flex;
  align-items: center;
  gap: var(--spacing-s, 0.75rem);
  border: 1px solid var(--ui-color-primary, #0f4d90);
  border-radius: 8px;
  padding: var(--spacing-s, 0.75rem);
  margin-bottom: var(--spacing-m, 1rem);
}
.issue-step__selected-icon {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.issue-step__selected-body {
  display: flex;
  flex-direction: column;
}
.issue-step__selected-name {
  font-weight: 700;
}
.issue-step__selected-desc {
  font-size: 0.875rem;
  color: var(--ui-color-grey-700, #4a4a4a);
}
.issue-step__change {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--ui-color-primary, #0f4d90);
  font-weight: 600;
  cursor: pointer;
}
.issue-step__questions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-m, 1rem);
  max-width: 640px;
}
.issue-step__legend {
  color: var(--ui-color-grey-700, #4a4a4a);
  font-size: 0.875rem;
}
.issue-step__error {
  color: var(--ui-color-red, #c0392b);
}
.issue-step__retry {
  background: none;
  border: 1px solid var(--ui-color-primary, #0f4d90);
  border-radius: 9999px;
  color: var(--ui-color-primary, #0f4d90);
  padding: 2px 12px;
  margin-left: var(--spacing-s, 0.75rem);
  cursor: pointer;
}
.issue-step__photo-band :deep(.type-suggestions) {
  align-self: start;
}
@media (max-width: 768px) {
  .issue-step__photo-band {
    grid-template-columns: 1fr;
  }
}
</style>
```

Notes:
- A deep-linked category that isn't in the catalog (or catalog still loading) renders the summary with just the name; `visible` is empty so validity passes on category alone — matches the guard's seeding contract and resolves as soon as `load()` lands.
- The placeholder's `inject` + `onMounted` pattern is replaced by `useWizardValidity` — this step finally uses the composable.

- [ ] **Step 4: Run — expect PASS.** Then FULL `test:run` (no filter), `type-check`, `lint`, `format`.
- [ ] **Step 5: Commit**

```bash
git add apps/philly-311/frontend/src/pages/report/IssueTypeStep.vue apps/philly-311/frontend/src/pages/report/IssueTypeStep.test.ts
git commit -m "feat(philly-311): IssueTypeStep — selection, suggestions, conditional questions"
```

---

## Task 6: Full verification

**Files:** none.

- [ ] **Step 1: App gates**

```bash
pnpm --filter @pinboard/philly-311 type-check   # PASS
pnpm --filter @pinboard/philly-311 lint          # exit 0
pnpm --filter @pinboard/philly-311 test:run      # all green
pnpm --filter @pinboard/philly-311 build         # PASS
```

- [ ] **Step 2: Monorepo no-regressions**

```bash
pnpm build && pnpm type-check && pnpm exec turbo run test:run
git diff --name-only 311-staging..HEAD -- . ':(exclude)apps/philly-311/**' ':(exclude)docs/**' ':(exclude)pnpm-lock.yaml'   # empty
```
(`pnpm-lock.yaml` changes are expected from Task 1 — verify its diff only reflects the three Task 1 packages, including the philly-311 importer entry for `@fortawesome/vue-fontawesome`.)

- [ ] **Step 3: Real smoke (Playwright against the live dev server — satisfies spec DoD #4)** — `pnpm dev:311`, then drive a real browser:
  - No-photo path: `/report` → Skip → search "pothole" → select Pothole Repair → questions render → answer the required picklist → Next enables → Next lands on `/report/location`.
  - Photo path: `/report` → upload a photo → Next → recommendations panel shows (photo preview beside it) → click a card → questions view.
  - Change → back to pick view, answers cleared.
  - Known benign dev-only console error: `Unexpected token '<'` from `@phila/phila-ui-map-core` (Pictometry) — not ours.
  - Stop the server when done.

---

## Definition of Done (matches the spec)

1. `/report/issue-type` renders pick view (recommendations when photo present + searchable grouped directory) and questions view (summary + Change + conditional questions).
2. Selecting a type writes `store.category`; Change clears it; required visible questions gate Next via `useWizardValidity`.
3. `type-check`, `lint`, `test:run`, `build` green for `@pinboard/philly-311`; turbo green monorepo-wide; `@pinboard/ui` unchanged.
4. Real-browser smoke passes.

## Out of scope (later slices)

3c Location, 3d Details, 3e Review + submit + `/report/confirmation`.
