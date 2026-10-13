# @repo/playwright-config

Shared Playwright setup for the per-app `apps/*/e2e` packages.

| Export                 | Purpose                                                                     |
| ---------------------- | --------------------------------------------------------------------------- |
| `createConfig()`       | Base `playwright.config`: headless/headed handling, viewport, artifacts     |
| `resolveAppUrl()`      | Picks the app URL from `BASE_URL` or `TEST_ENV` (`test` / `prod`)           |
| `defineSmokeTests()`   | The post-deploy smoke checks, shared by every app (same shell, same checks) |
| `showTestNameOnPage()` | Shows the running test's name as a banner in the browser                    |

## Headless vs headed

- `CI` set → headless, no slow-motion.
- Locally → headed and maximized with `slowMo`, unless `HEADLESS=true`.
- Headless uses an explicit 1440x900 viewport. A maximized window does not exist
  headless, and Chromium's 800x600 default triggers the app's mobile layout
  (and its blocking "About this tool" sheet).
