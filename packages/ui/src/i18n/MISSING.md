# @pinboard/ui shell catalog — translation status

The shell chrome catalog (`packages/ui/src/i18n/messages/<locale>.ts`) holds the
framework chrome rendered by `@pinboard/ui` (PinboardBody, SortPanel, footer, nav,
info page). This tracks where each string came from and what still needs a native
speaker's review.

## Professionally sourced (from vue3-pinboard / @phila/pinboard)

Ported from `vue3-pinboard/src/i18n/<locale>.js`; considered final.

- `footer.*` — termsOfUse, rightToKnow, privacyPolicy, accessibility, feedback
- `nav.learnMore`
- `infoPage.backToMap`, `infoPage.onThisPage`
- `mapView` — from vue3-pinboard `app.viewMap`
- `filters` — from vue3-pinboard `refinePanel.refine`

## AI first-pass — NEEDS NATIVE REVIEW

vue3-pinboard has no clean equivalent for these, so they were translated as a first
pass. Review before release.

| Key                 | Notes                                                                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `itemCount`         | Pluralized (0 / 1 / many). **ru & ar plural grammar can't be fully expressed** in vue-i18n's 3-slot rule — the "many" form is right for counts like 56 but not every number (ru 2–4, ar 3–10 differ). |
| `noLocations`       | Empty-state ("no results match").                                                                                                                                                                     |
| `sort`, `sortBy`    | Verb aligned per locale to the app's `filters.sort`, so the Sort chip and the Sort panel header share the same verb.                                                                                  |
| `sortClosest`       | "Closest to furthest" sort option.                                                                                                                                                                    |
| `sortShareLocation` | "Share your location to sort by distance" prompt.                                                                                                                                                     |
| `reset`, `apply`    | Common UI buttons; high confidence but unreviewed.                                                                                                                                                    |
| `allFilters`        | "All filters" — the FilterPanel header title.                                                                                                                                                         |

## How to verify in the app

Switch locale, then check: the locations list header (`itemCount`), an empty filter
result (`noLocations`), and the Sort chip → its panel (`sort` / `sortBy` /
`sortClosest` / `sortShareLocation` / `reset` / `apply`). Footer/nav are in the shell
chrome at the bottom of the page.
