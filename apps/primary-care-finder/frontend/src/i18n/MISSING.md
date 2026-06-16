# Missing Translations — Primary Care Finder

These keys currently render in **English** (via `fallbackLocale: 'en'` in vue-i18n) because they
are absent from the non-English locale files. They must be sent to the city's translation service
and then added to the appropriate locale files listed below.

Affected non-English locales: **es, ch, vi, ru, fr, ar, pt, ht, sw**

---

## App strings — `apps/primary-care-finder/frontend/src/i18n/<locale>.ts`

All 9 non-English locale files are missing the keys below. Provide translations for each locale.

### `app.*` — application metadata

| Key              | English source text                                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app.viewList`   | `View list`                                                                                                                                                                                                  |
| `app.viewMap`    | `View map`                                                                                                                                                                                                   |
| `app.name`       | `Primary Care Finder`                                                                                                                                                                                        |
| `app.aboutTitle` | `About this tool`                                                                                                                                                                                            |
| `app.aboutBody`  | `This tool helps Philadelphia residents find free and low-cost primary care providers near them. Search by location, filter by services, and view details like hours, transit options, and available tests.` |

### `filters.*` — sidebar filter labels (entire section missing)

| Key                  | English source text            |
| -------------------- | ------------------------------ |
| `filters.sort`       | `Sort`                         |
| `filters.distance`   | `Distance`                     |
| `filters.name`       | `Name (A–Z)`                   |
| `filters.ageGroup`   | `Age Group`                    |
| `filters.adult`      | `Adult`                        |
| `filters.children`   | `Children`                     |
| `filters.waitTime`   | `Wait time (Primary Care)`     |
| `filters.sameDay`    | `Same day or walk in`          |
| `filters.weekWell`   | `<1 week (well visit)`         |
| `filters.weekSick`   | `<1 week (sick visit)`         |
| `filters.twoMonths`  | `<2 months (all primary care)` |
| `filters.specialty`  | `Speciality services`          |
| `filters.mental`     | `Mental health`                |
| `filters.dental`     | `Dental`                       |
| `filters.eye`        | `Eye care`                     |
| `filters.podiatry`   | `Podiatry`                     |
| `filters.mat`        | `MAT`                          |
| `filters.nutrition`  | `Nutrition`                    |
| `filters.tobacco`    | `Tobacco cessation`            |
| `filters.pharmacy`   | `Pharmacy`                     |
| `filters.tests`      | `Tests and imaging`            |
| `filters.blood`      | `Blood`                        |
| `filters.sti`        | `STI`                          |
| `filters.covid`      | `COVID`                        |
| `filters.mammo`      | `Mammography`                  |
| `filters.xray`       | `X-ray`                        |
| `filters.languages`  | `Languages spoken by staff`    |
| `filters.spanish`    | `Spanish`                      |
| `filters.mandarin`   | `Mandarin`                     |
| `filters.vietnamese` | `Vietnamese`                   |

### Search / navigation strings

| Key                 | English source text               |
| ------------------- | --------------------------------- |
| `searchPlaceholder` | `Search by address or keyword...` |
| `closeDetails`      | `Close details`                   |

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

**Total missing app keys per locale: 50**

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
- Once translated strings are received, add them to the respective locale files and remove the
  corresponding rows from this document.
