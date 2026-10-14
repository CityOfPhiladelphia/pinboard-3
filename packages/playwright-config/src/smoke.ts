import { test, expect, type Page } from '@playwright/test'
import { waitForDeployment } from './wait-for-deploy'

// A freshly deployed app or a cold CDN edge can be slow to first paint, so the
// load-dependent assertions get more than Playwright's 5s default.
const LOAD_TIMEOUT = 15000

// How long to wait for a just-shipped bundle to start being served. A CloudFront
// invalidation normally lands within a couple of minutes; anything longer is a
// real problem worth failing fast on.
const DEPLOY_TIMEOUT = 2 * 60 * 1000

export interface SmokeOptions {
  // Used in the describe title
  name: string
  url: string
  // Expected browser tab title
  title: RegExp
  // A search that must return at least one result
  searchValue: string
}

const searchBox = (page: Page) => page.getByRole('textbox', { name: /search/i })
const searchButton = (page: Page) => page.getByRole('button', { name: /^search$/i }).first()
const resultCards = (page: Page) => page.locator('.location-list .location-card')

// The flood app can open its About tooltip on load, which covers the controls.
async function dismissTooltipIfOpen(page: Page) {
  const dismiss = page.getByRole('button', { name: 'Dismiss tooltip' })
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click()
  }
}

// Post-deployment smoke tests.
//
// Deliberately strict and small: each test asserts something that proves the
// deployed app works end to end, and none of them pass silently when data is
// missing (unlike the "if available" tests in the other spec files).
//
// All apps share the same pinboard shell, so the checks are identical.
export function defineSmokeTests({ name, url, title, searchValue }: SmokeOptions) {
  test.setTimeout(60000)

  test.describe(`${name} @smoke`, () => {
    // Runs once per worker. Cheap when the deployment is already serving.
    test.beforeAll(async ({}, testInfo) => {
      testInfo.setTimeout(DEPLOY_TIMEOUT + 30000)
      await waitForDeployment(url, DEPLOY_TIMEOUT)
    })

    test.beforeEach(async ({ page }) => {
      const problems: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(`console error: ${msg.text()}`)
      })
      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`))
      page.on('requestfailed', (request) =>
        problems.push(`request failed: ${request.url()} (${request.failure()?.errorText})`)
      )

      const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
      // No networkidle wait: the apps poll, so it can stall for tens of
      // seconds. The assertions below auto-wait for what they need.
      try {
        await expect(searchBox(page)).toBeVisible({ timeout: LOAD_TIMEOUT })
      } catch (error) {
        // "element not found" says nothing about why; say what the page did.
        const body = (
          (await page
            .locator('body')
            .innerText()
            .catch(() => '')) || '(empty)'
        )
          .slice(0, 300)
          .replace(/\s+/g, ' ')
        const report = [
          `App did not render at ${url}`,
          `  HTTP status: ${response?.status() ?? 'no response'}`,
          `  Page title: ${(await page.title().catch(() => '')) || '(none)'}`,
          `  Body text: ${body}`,
          ...(problems.length
            ? problems.slice(0, 10).map((p) => `  ${p}`)
            : ['  (no browser errors)']),
        ].join('\n')
        throw new Error(`${report}\n\n${error instanceof Error ? error.message : String(error)}`)
      }
      await dismissTooltipIfOpen(page)
    })

    test('loads with title, search controls and map', async ({ page }) => {
      await expect(page).toHaveTitle(title, { timeout: LOAD_TIMEOUT })
      await expect(searchBox(page)).toBeVisible()
      await expect(searchButton(page)).toBeVisible()
      await expect(page.locator('.maplibregl-canvas').first()).toBeVisible({
        timeout: LOAD_TIMEOUT,
      })
    })

    test('search returns result cards', async ({ page }) => {
      await searchBox(page).fill(searchValue)
      await searchButton(page).click()

      await expect(resultCards(page).first()).toBeVisible({ timeout: LOAD_TIMEOUT })
      expect(await resultCards(page).count()).toBeGreaterThan(0)
    })

    test('result card opens its detail panel', async ({ page }) => {
      await searchBox(page).fill(searchValue)
      await searchButton(page).click()

      const firstCard = resultCards(page).first()
      await expect(firstCard).toBeVisible({ timeout: LOAD_TIMEOUT })
      // The first line of a card is the location name in both apps
      const cardName = (await firstCard.innerText()).split('\n')[0].trim()
      expect(cardName.length).toBeGreaterThan(0)

      await firstCard.click()

      await expect(page).toHaveURL(/[?&]location=/)
      const detail = page.locator('.location-detail').first()
      await expect(detail).toBeVisible()
      // Not tied to a heading level: prod and test can run different builds
      await expect(detail).toContainText(cardName)
    })
  })
}
