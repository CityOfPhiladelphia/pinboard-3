# F2: Answers pages — design

**Date:** 2026-06-12
**Branch:** `feat/f2-answers` off `311-staging`; merge back `--no-ff`; nothing pushed.
**App:** `apps/philly-311` (Vue 3 + TS, vitest, PinboardShell chrome).

## Goal

Replace the `/answers/:id` placeholder with a real knowledge-article detail page, add an
`/answers` browse + search page, and give Answers an entry point (navbar + mobile nav).
Since slice F1 removed the landing trending strip, nothing links to Answers today.

Design anchor: the POC at `311-mobile-app/web/webportal` (no Figma design exists for
Answers — confirmed with Darren). Skin follows the app's existing conventions
(ReportPage-style centered container, CSS variables, pill buttons), not the POC's styles.

## Decisions (made with Darren)

1. **Scope:** list page + detail page + navbar "Answers" link (via PinboardShell's existing
   `#navbar-end` slot — no `@pinboard/ui` changes) + mobile-nav link.
2. **Detail CTA:** unconditional "Start a report →" link to `/report` on every article.
   The POC's `serviceType`-gated CTA is dead code — the API returns no `serviceType` on
   either list or detail (`oit-se-311-api/apps/api/knowledge.ts` `KnowledgeArticle` /
   `KnowledgeArticleDetail`) — so the conditional variant is not ported. (bd issue to be
   filed against the POC for its dead CTA conditional.)
3. **Delete `useTrendingArticles`** (+ its test): orphaned after F2. AnswersPage uses
   `loadArticles` directly; the landing trending strip is gone per Figma. Darren approved
   the deletion.
4. **POC navbar fuzzy search (HeaderSearch) is out of scope** — deferred; the list page has
   its own search.

## Existing foundation (already on `311-staging`)

- `composables/useKnowledgeArticles.ts` — tested data layer.
  `loadArticles({ pageSize?, nextPageToken?, search? })` → `{ items: Article[], nextPageToken? }`
  (GET `/private/key/knowledge-articles`, pagination via Link-header offset, server-side
  SOSL `search`). `loadArticle(id)` → `Article | null` (null on 404, throws `ApiError` on
  5xx; maps detail `content` → `body`).
- `Article`: `{ id, title, body?, serviceType?, lastPublishedAt?, url? }`. `body` is HTML
  and MUST be sanitized before rendering. `serviceType` is never populated by the API —
  remove the field from the interface as part of this slice (it is otherwise a lie).
- `composables/useDebouncedSearch.ts` — reuse for the list-page search (the POC's inline
  `setTimeout` debounce is not ported).
- Router already applies `?category=` deep links into the wizard (`router/index.ts`) —
  not needed for the unconditional CTA, but no router work is required either way.
- `dompurify` + `@types/dompurify` already in `package.json`, unused so far.

## Components

### `utils/sanitize.ts` (port from POC `frontend/src/utils/sanitize.ts`)

DOMPurify wrapper. Explicit allow-lists only (no `USE_PROFILES` — combining them re-adds
unwanted attrs like `style`; the POC comment documenting this is preserved):

- `ALLOWED_TAGS`: `a p strong em ul ol li br h2 h3 h4 blockquote code pre`
- `ALLOWED_ATTR`: `href rel target title`
- `afterSanitizeAttributes` hook forces `rel="noopener"` and `target="_blank"` on links.

### `components/answers/ArticleBody.vue` (port)

Renders `sanitize(html)` via `v-html`. Article-content typography scoped here.

### `components/answers/ArticleCard.vue` (port, restyled)

Title-only card linking to `/answers/{article.id}`. Skin per app conventions.

### `pages/AnswersPage.vue` (new; logic ported from POC)

Route: `/answers` (lazy-loaded, added to router).

- Heading + intro line + labeled search input.
- Empty query → paginated list: initial `loadArticles()`, "Load more" button shown while
  `nextPageToken` exists (hidden during search), appends pages.
- Non-empty query (trimmed) → debounced (`useDebouncedSearch`) server-side search;
  results replace the list; not paginated. A sequence guard drops out-of-order resolutions
  (the POC's `searchSeq` pattern). Clearing the query cancels any pending search and
  reloads the initial page.
- States: loading text; error (`role="alert"`, message from the thrown error); "No articles
  match “{query}”." when a search returns empty; "No articles available." when the
  unfiltered list is empty.
- Layout: centered max-width container consistent with ReportPage.

### `pages/AnswerDetailPage.vue` (replaces placeholder)

Route: `/answers/:id` (already wired).

- Loads on mount; re-loads when the route id changes (watch).
- States: loading; not-found (`loadArticle` → null: "Article not found" + link back to
  `/answers`); error (`role="alert"` with `ApiError` message); article with missing `body`
  (friendly "no content yet" + link back).
- Renders: breadcrumb back to `/answers` (wizard breadcrumb style), `h1` title,
  `ArticleBody`, then unconditional "Start a report →" RouterLink to `/report`.

### `App.vue` (entry points)

- `#navbar-end`: "Answers" RouterLink → `/answers` (slot precedent: oem-flood-finder's
  NavbarInfo). Styled to sit in the phila navbar.
- `#mobile-nav`: same link inside PinboardShell's MobileNavPanel so the page is reachable
  on small screens. Verify during implementation how AppHeader renders `navbar-end` on
  mobile widths; the mobile-nav entry is the fallback that must always work.

## Deletions

- `composables/useTrendingArticles.ts` + `useTrendingArticles.test.ts`.
- `Article.serviceType` field.
- The placeholder content of `AnswerDetailPage.vue`.

## Error handling

Follows the data layer's contract: list/search failures surface the error message inline
on the page (`role="alert"`); detail 404 is a distinct not-found state, 5xx an error
state. No retries; navigation or re-typing re-triggers loads.

## Testing (TDD throughout)

- `sanitize.test.ts`: strips `script`/`iframe`/`form`/`style` attrs; keeps allowed tags;
  rewrites links with `noopener`/`_blank`.
- `ArticleBody` test: renders sanitized HTML (malicious input does not survive to DOM).
- `ArticleCard` test: title + link target.
- `AnswersPage` test (mocked fetch per app conventions): initial load, Load more
  append + hide-at-end, search replaces list + no Load more, out-of-order search
  resolutions dropped, clear-query reload, empty/error states.
- `AnswerDetailPage` test: loading → article render, 404 state, error state, no-body
  state, id-change reload, CTA link present.
- `App.vue` test: navbar + mobile-nav Answers links render.
- Existing suites stay green (361+ on `311-staging` plus F1's additions; deleting
  `useTrendingArticles.test.ts` removes its 35 lines of coverage with the feature).
- Final: live Playwright smoke against the dev API — navbar → `/answers` → search →
  pick article → sanitized body renders → "Start a report" → wizard. (Headed Chrome if
  the map/WebGL issue applies; the known benign Pictometry console error is not ours.)

## Out of scope

Navbar fuzzy search (HeaderSearch), trending on landing, article-to-serviceType CTA
mapping (needs API support), F3 a11y/dedupe debt (icon-disc, pill-button dedupe, etc.).
