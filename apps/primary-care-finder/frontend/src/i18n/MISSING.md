# Missing Translations — Primary Care Finder

These keys currently render in **English** (via `fallbackLocale: 'en'` in vue-i18n) because they
are absent from the non-English locale files. They must be sent to the city's translation service
and then added to the appropriate locale files listed below.

Affected non-English locales: **es, zh, vi, ru, fr, ar, pt, ht, sw**

> **Back-fill note (option 1):** The page title and the visible filter-chip category labels were
> re-keyed from existing legacy translations already present in each locale file (e.g. `app.name`
> from `app.title`, `filters.specialty` from `specialty.category`). Those keys are therefore no
> longer listed below. The keys that remain are **genuinely new** — they have no legacy equivalent
> to copy from (new sort feature, abbreviated chip labels that differ from the legacy detail labels,
> per-language names, about/search text) and need real translation. See the taxonomy-reconcile bead
> in the Notes section for the planned cleanup of the duplicate legacy keys.

---

## App strings — `apps/primary-care-finder/frontend/src/i18n/<locale>.ts`

All 9 non-English locale files are missing the keys below. Provide translations for each locale.

### `app.*` — application metadata

| Key              | English source text                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app.viewList`   | `View list`                                                                                                                                                                                                  |
| `app.viewMap`    | `View map`                                                                                                                                                                                                   |
| `app.aboutTitle` | `About this tool`                                                                                                                                                                                            |
| `app.aboutBody`  | `This tool helps Philadelphia residents find free and low-cost primary care providers near them. Search by location, filter by services, and view details like hours, transit options, and available tests.` |

### `filters.*` — sidebar filter labels (remaining new keys only)

The category labels (`ageGroup`, `waitTime`, `specialty`, `tests`, `languages`) and the matching
choices that share legacy wording were back-filled. The keys below remain because their English
text is new or differs from any legacy label.

| Key                  | English source text   |
| -------------------- | --------------------- |
| `filters.sameDay`    | `Same day or walk in` |
| `filters.mat`        | `MAT`                 |
| `filters.nutrition`  | `Nutrition`           |
| `filters.tobacco`    | `Tobacco cessation`   |
| `filters.pharmacy`   | `Pharmacy`            |
| `filters.blood`      | `Blood`               |
| `filters.sti`        | `STI`                 |
| `filters.covid`      | `COVID`               |
| `filters.spanish`    | `Spanish`             |
| `filters.mandarin`   | `Mandarin`            |
| `filters.vietnamese` | `Vietnamese`          |

### Search / navigation strings

| Key            | English source text |
| -------------- | ------------------- |
| `closeDetails` | `Close details`     |

### Hours and schedule strings (legacy gap — never present in ported catalogs)

| Key               | English source text        |
| ----------------- | -------------------------- |
| `hours`           | `Hours`                    |
| `daysOfTheWeek`   | `Day`                      |
| `schedule`        | `Schedule`                 |
| `languagesSpoken` | `Languages spoken`         |
| `english`         | `English`                  |
| `noInfo`          | `No information available` |
| `Monday`          | `Monday`                   |
| `Tuesday`         | `Tuesday`                  |
| `Wednesday`       | `Wednesday`                |
| `Thursday`        | `Thursday`                 |
| `Friday`          | `Friday`                   |
| `Saturday`        | `Saturday`                 |
| `Sunday`          | `Sunday`                   |

**Total missing app keys per locale: 29** (was 50; 17 back-filled from legacy keys, 4 sourced from @phila/pinboard)

---

## Shared shell chrome — `packages/ui/src/i18n/messages/<locale>.ts`

All 9 non-English locale files contain these keys but with **identical English values** (they were
ported as English stubs). All 9 `pinboard.*` keys need real translations for all 9 locales.

| Key                          | English source text                             |
| ---------------------------- | ----------------------------------------------- |
| `pinboard.itemCount`         | `no locations \| {count} item \| {count} items` |
| `pinboard.noLocations`       | `No locations match`                            |
| `pinboard.mapView`           | `Map view`                                      |
| `pinboard.sort`              | `Sort`                                          |
| `pinboard.sortBy`            | `Sort: {label}`                                 |
| `pinboard.sortClosest`       | `Closest to furthest`                           |
| `pinboard.sortShareLocation` | `Share your location to sort by distance`       |
| `pinboard.reset`             | `Reset`                                         |
| `pinboard.apply`             | `Apply`                                         |

**Total missing chrome keys per locale: 9 (× 9 locales = 81 (locale, key) pairs)**

Note: `{count}` and `{label}` are vue-i18n interpolation placeholders — they must be preserved
verbatim in all translations. `itemCount` uses vue-i18n plural syntax
(`zero | singular | plural`); provide all three forms for languages with different plural rules.

---

## Notes

- **Arabic (`ar`)**: translations exist for the shared-chrome stubs and the app-string stubs, but
  the layout remains left-to-right. RTL mirroring (`dir="rtl"`) is a separate future effort.
- **Taxonomy reconcile (deferred):** the app catalog currently carries the same content under two
  key structures — the new `filters.*` / `app.name` keys the UI reads, and the legacy
  `specialty.*` / `tests.*` / `waitTime.*` / `ageRange.*` / `app.title` keys the detail components
  read. The option-1 back-fill copied translations from the legacy keys into the new keys. A planned
  follow-up will collapse the duplication (tracked as a bead — see commit/handoff). Until then, both
  sets must stay in sync.
- **Pre-existing data-quality bugs in legacy translations** (not introduced by the back-fill; they
  already ship in the detail panels): `ht` `tests.category` = `'Tès ak D'` (truncated) and `sw`
  `languages.category` = `'Lugha inayozungumzwa na wafany'` (truncated — should end "wafanyikazi").
  These were copied verbatim into `ht`/`sw` `filters.tests` and `filters.languages`. Fix at the
  source when the city translation service reviews this app.
- **Search placeholder and the Sort chip** (`searchPlaceholder`, `filters.sort` / `distance` /
  `name`) were sourced 2026-06-17 from the `@phila/pinboard` (vue3-pinboard) professional city
  translations. Note: `filters.sort` uses the translation of "Sort by" and `filters.name` the
  translation of "Alphabetically" — the closest professionally-translated concepts to the new
  English labels "Sort" / "Name (A–Z)".
- **Footer links** (`pinboard.footer.termsOfUse` / `rightToKnow` / `privacyPolicy` /
  `accessibility` / `feedback`) were added to the shared chrome catalog
  (`packages/ui/src/i18n/messages/<locale>.ts`) on 2026-06-17 and rendered via the new
  `PinboardSubFooter` in `PinboardShell` (which overrides phila-ui-4 `AppFooter`'s hardcoded-English
  default; apps can still override via the `sub-footer` slot). The first four labels' 9 non-English
  translations were done **by hand** — no authoritative city source was available — so the city
  translation service should **verify them, especially "Right to know"** (the PA Right-to-Know Law
  term). The `feedback` label was sourced from `@phila/pinboard` professional translations. The
  feedback link's **URL is app-specific** (not in shared chrome): it is supplied via `PinboardShell`'s
  `feedbackHref` prop — primary-care passes the Dept. of Public Health contact-us URL. These keys are
  translated (not on the pending list above).
- Once translated strings are received, add them to the respective locale files and remove the
  corresponding rows from this document.
