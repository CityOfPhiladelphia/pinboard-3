// Import Playwright test runner, assertion library, Page type, and Locator type
import { test, expect, Page, Locator } from '@playwright/test'

// Give this file more time because this test loops through multiple result cards
test.setTimeout(120000)

// Store the app URL in one place so it is easy to update later
const APP_URL = 'https://flood-monitoring-test.phila.gov/'

// =====================================================
// CENTRALIZED TEST DATA
// Update these if you want to test different search values.
// =====================================================

const TEST_DATA = {
  // Search value used to load result cards
  // Use 'Cobbs Creek' for both Gauge and Camera results
  // Use 'Springfield' for Camera-only result testing
  // Use 'Philadelphia' for no-results testing
  // Leave blank for all results, but keep maxResultsToVerify low if blank
  resultSearchValue: 'Cobbs Creek',

  // Limit how many result cards to verify so the test does not timeout
  maxResultsToVerify: 5,
}

// =====================================================
// CENTRALIZED WAIT TIMES
// Update these if the app needs more or less time.
// =====================================================

const WAIT_TIMES = {
  // Short wait after small UI actions
  shortWait: 300,

  // Medium wait after clicking result cards or closing detail panels
  mediumWait: 700,

  // Longer timeout for result cards that may need scrolling
  resultCardTimeout: 10000,

  // Timeout for selected result detail to load
  detailLoadTimeout: 10000,

  // Short timeout for optional snapshot/image/video loading
  // Keep this low because this is checked for every card in the loop
  mediaLoadTimeout: 2000,
}

// =====================================================
// CENTRALIZED ROLE NAMES
// Can be updated these if button/link/input accessible names change later.
// =====================================================

const ROLES = {
  // Search textbox accessible name
  // Regex makes this work for both old and new app labels
  searchTextboxName: /Search by address.*keyword/i,

  // Search button accessible name
  searchButtonName: 'Search',

  // All filter button name
  allFilterName: 'All',

  // Gauge tag/button name
  gaugeName: 'Gauge',

  // Camera tag/button name
  cameraName: 'Camera',

  // Tooltip dismiss button accessible name
  dismissTooltipName: 'Dismiss tooltip',
}

// =====================================================
// CENTRALIZED TEXT PATTERNS
// Update these if the app wording changes later.
// =====================================================

const TEXT_PATTERNS = {
  // Gauge value examples: 2.1 ft, 22.5 in, 0 in, No data
  gaugeReading: /\d+(\.\d+)?\s?(ft|in)|No data/i,

  // Last updated text pattern
  lastUpdated: /last updated|updated|last reading|reading time|as of/i,

  // Snapshot/current image pattern
  currentSnapshot: /current snapshot|snapshot|current image|image|photo/i,

  // Gauge detail content pattern
  gaugeDetails: /gauge|water|height|level|updated|data|ft|in|No data/i,

  // Camera detail content pattern
  cameraDetails: /camera|updated|live|stream|video|image|snapshot/i,

  // Graph view pattern
  graphView: /graph|chart|water level|height|level/i,

  // Table view pattern
  tableView: /table|date|time|reading|height|level|water/i,
}

// =====================================================
// CSS SELECTORS ONLY WHERE ROLE IS NOT AVAILABLE
// =====================================================

const CSS = {
  // Main finder panel selector
  finderPanel: '.finder-panel',

  // Location list selector
  locationList: '.location-list',

  // Result card selector
  resultCards: '.phila-map-card',

  // Result card heading selector
  resultHeading: 'h6',
}

// =====================================================
// PAGE OBJECT STYLE HELPERS
// Tests call these instead of repeating locators.
// =====================================================

const floodMonitoringApp = (page: Page) => ({
  // Search textbox locator
  searchBox: () => page.getByRole('textbox', { name: ROLES.searchTextboxName }),

  // Search button locator
  searchButton: () =>
    page.getByRole('button', { name: ROLES.searchButtonName }),

  // Top filter group locator
  filterGroup: () => page.getByRole('group'),

  // All filter button locator scoped inside the top filter group
  allFilter: () =>
    page.getByRole('group').getByRole('button', {
      name: ROLES.allFilterName,
    }),

  // Main finder panel locator
  finderPanel: () => page.locator(CSS.finderPanel).first(),

  // Location list locator
  locationList: () => page.locator(CSS.locationList).first(),

  // All result cards inside the location list
  resultCards: () => page.locator(CSS.resultCards),

  // Result card locator by result name
  resultCardByName: (resultName: string) =>
    page
      .locator(CSS.resultCards)
      .filter({
        has: page.getByRole('heading', {
          name: resultName,
          level: 6,
        }),
      })
      .first(),

  // Result heading locator by result name
  resultHeadingByName: (resultName: string) =>
    page.getByRole('heading', {
      name: resultName,
      level: 6,
    }),

  // Page body locator
  body: () => page.locator('body'),

  // Dismiss tooltip button locator
  dismissTooltipButton: () =>
    page.getByRole('button', { name: ROLES.dismissTooltipName }),

  // Possible close buttons for selected result detail panel
  closeResultButtonByLabel: () =>
    page
      .getByRole('button', {
        name: /close|dismiss|back/i,
      })
      .first(),

  // Possible X close button fallback
  closeResultButtonByText: () =>
    page
      .locator('button')
      .filter({ hasText: /^×$|^x$/i })
      .first(),

  // Gauge Graph button or tab
  graphButtonOrTab: () =>
    page
      .getByRole('button', { name: /graph|chart/i })
      .or(page.getByRole('tab', { name: /graph|chart/i }))
      .first(),

  // Gauge Table button or tab
  tableButtonOrTab: () =>
    page
      .getByRole('button', { name: /table/i })
      .or(page.getByRole('tab', { name: /table/i }))
      .first(),
})

// =====================================================
// SHARED HELPERS
// =====================================================

// Close About tooltip if it is open and blocking clicks
async function closeAboutTooltipIfOpen(page: Page) {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Check if dismiss tooltip button is visible
  const isDismissVisible = await app
    .dismissTooltipButton()
    .isVisible()
    .catch(() => false)

  // Close tooltip if it is visible
  if (isDismissVisible) {
    await app.dismissTooltipButton().click()
  }
}

// Shows the current test name on the browser page during runtime
async function showTestNameOnPage(page: Page, testName: string) {
  // Inject a banner into the browser page
  await page.evaluate<void, string>((name: string) => {
    // Remove existing banner if one already exists
    const existingBanner = document.getElementById('playwright-test-banner')

    // Remove old banner before creating a new one
    if (existingBanner) {
      existingBanner.remove()
    }

    // Create a new banner element (This is to see which test is running in the browser during runtime)
    const banner = document.createElement('div')

    // Set unique banner ID
    banner.id = 'playwright-test-banner'

    // Set banner text
    banner.textContent = `Running test: ${name}`

    // Keep banner fixed at the top of the browser
    banner.style.position = 'fixed'

    // Position banner from the top
    banner.style.top = '10px'

    // Center banner horizontally
    banner.style.left = '50%'

    // Adjust center alignment
    banner.style.transform = 'translateX(-50%)'

    // Keep banner above app UI
    banner.style.zIndex = '999999'

    // Set banner background color
    banner.style.background = '#111827'

    // Set banner text color
    banner.style.color = 'white'

    // Add spacing inside banner
    banner.style.padding = '10px 16px'

    // Round banner corners
    banner.style.borderRadius = '8px'

    // Set readable font size
    banner.style.fontSize = '24px'

    // Set font family
    banner.style.fontFamily = 'Arial, sans-serif'

    // Add shadow so banner stands out
    banner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)'

    // Prevent banner from blocking clicks on the app
    banner.style.pointerEvents = 'none'

    // Add banner to the page body
    document.body.appendChild(banner)
  }, testName)
}

// Wait until the finder/search area is ready
// This does not fail when there are zero result cards
async function waitForSearchAreaReady(page: Page) {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify finder panel is visible
  await expect(app.finderPanel()).toBeVisible({
    timeout: WAIT_TIMES.resultCardTimeout,
  })

  // Check whether location list is visible
  const locationListVisible = await app
    .locationList()
    .isVisible()
    .catch(() => false)

  // Print location list status
  console.log(`Location list visible: ${locationListVisible}`)
}

// Check whether any result cards are available after search
async function hasSearchResults(page: Page): Promise<boolean> {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Count result cards
  const resultCardCount = await app.resultCards().count()

  // Print result card count
  console.log(`Result card count after search: ${resultCardCount}`)

  // Return true only if at least one card exists
  return resultCardCount > 0
}

// Wait until the result list has at least one result card
// Use this only after confirming results exist
async function waitForResultCardsReady(page: Page) {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify first result card is visible
  await expect(app.resultCards().first()).toBeVisible({
    timeout: WAIT_TIMES.resultCardTimeout,
  })
}

// Reset the result filter back to All before searching
async function resetFilterToAll(page: Page) {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify filter group is visible
  await expect(app.filterGroup()).toBeVisible({
    timeout: WAIT_TIMES.resultCardTimeout,
  })

  // Check if All filter is already selected
  const isAllSelected =
    (await app.allFilter().getAttribute('aria-pressed')) === 'true'

  // Click All filter only if it is not already selected
  if (!isAllSelected) {
    await app.allFilter().click()

    // Give result list time to update after changing filter
    await page.waitForTimeout(WAIT_TIMES.mediumWait)
  }

  // Verify All filter is selected
  await expect(app.allFilter()).toHaveAttribute('aria-pressed', 'true', {
    timeout: WAIT_TIMES.resultCardTimeout,
  })
}

// Search by keyword
// Returns true when result cards exist
// Returns false when no result cards exist
async function searchByValue(
  page: Page,
  searchValue: string
): Promise<boolean> {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Reset to All first so test can find both Gauge and Camera results
  await resetFilterToAll(page)

  // Verify search box is visible
  await expect(app.searchBox()).toBeVisible()

  // Clear the search field
  await app.searchBox().fill('')

  // Enter the search value
  await app.searchBox().fill(searchValue)

  // Click the Search button
  await app.searchButton().click()

  // Give search results a moment to update
  await page.waitForTimeout(WAIT_TIMES.mediumWait)

  // Verify search value remains in the search box
  await expect(app.searchBox()).toHaveValue(searchValue)

  // Wait until finder/search area is ready
  await waitForSearchAreaReady(page)

  // Return whether search produced result cards
  return await hasSearchResults(page)
}

// Get only visible result names after search
async function getVisibleResultNames(page: Page): Promise<string[]> {
  // Collect result names from only visible cards
  const visibleResultNames = await page
    .locator(CSS.resultCards)
    .evaluateAll<string[], { resultHeading: string }>(
      (
        cards: Element[],
        selectors: {
          resultHeading: string
        }
      ): string[] => {
        // Create an empty list for result names
        const names: string[] = []

        // Loop through every card found in the DOM
        for (const card of cards) {
          // Get computed style for the card
          const style = window.getComputedStyle(card)

          // Get card size and position
          const box = card.getBoundingClientRect()

          // Check if card is actually visible
          const isVisible =
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0' &&
            box.width > 0 &&
            box.height > 0

          // Skip hidden cards
          if (!isVisible) {
            continue
          }

          // Find the heading inside the card
          const heading = card.querySelector(selectors.resultHeading)

          // Get heading text
          const headingText = heading?.textContent?.trim()

          // Add heading text if it exists
          if (headingText) {
            names.push(headingText)
          }
        }

        // Return visible result names
        return names
      },
      {
        resultHeading: CSS.resultHeading,
      }
    )

  // Remove duplicates just in case the app renders duplicates
  const uniqueVisibleResultNames: string[] = [...new Set(visibleResultNames)]

  // Print visible result names
  console.log(
    'Visible result names found after search:',
    uniqueVisibleResultNames
  )

  // Return unique visible result names
  return uniqueVisibleResultNames
}

// Prepare a result card before checking/clicking it
async function prepareResultCardForTesting(card: Locator) {
  // Scroll card into view first because some cards are hidden until scrolled
  await card.scrollIntoViewIfNeeded()

  // Small wait after scroll so the card can stabilize
  await card.page().waitForTimeout(WAIT_TIMES.shortWait)

  // Verify current card is visible after scrolling
  await expect(card).toBeVisible({
    timeout: WAIT_TIMES.resultCardTimeout,
  })
}

// Check if a result card is a Gauge card
async function isGaugeCard(card: Locator) {
  // Look for Gauge tag inside the card
  const gaugeTag = card.getByRole('button', { name: ROLES.gaugeName }).first()

  // Return whether Gauge tag is visible
  return await gaugeTag.isVisible().catch(() => false)
}

// Check if a result card is a Camera card
async function isCameraCard(card: Locator) {
  // Look for Camera tag inside the card
  const cameraTag = card.getByRole('button', { name: ROLES.cameraName }).first()

  // Return whether Camera tag is visible
  return await cameraTag.isVisible().catch(() => false)
}

// Verify Gauge details inside a result card before clicking
async function verifyGaugeCard(card: Locator, resultName: string) {
  // Verify Gauge tag is visible
  await expect(
    card.getByRole('button', { name: ROLES.gaugeName }).first()
  ).toBeVisible({
    timeout: WAIT_TIMES.resultCardTimeout,
  })

  // Verify the card has either a gauge value or No data
  await expect(card.getByText(TEXT_PATTERNS.gaugeReading).first()).toBeVisible({
    timeout: WAIT_TIMES.resultCardTimeout,
  })

  // Print Gauge result info
  console.log(`Verified Gauge result before click: ${resultName}`)
}

// Verify Camera details inside a result card before clicking
async function verifyCameraCard(card: Locator, resultName: string) {
  // Verify Camera tag is visible
  await expect(
    card.getByRole('button', { name: ROLES.cameraName }).first()
  ).toBeVisible({
    timeout: WAIT_TIMES.resultCardTimeout,
  })

  // Print Camera result info
  console.log(`Verified Camera result before click: ${resultName}`)
}

// Soft-check optional text in detail panel without failing if app does not provide it
async function softCheckDetailText(
  page: Page,
  label: string,
  pattern: RegExp,
  resultName: string
): Promise<boolean> {
  // Check if text exists somewhere on the page
  const isVisible = await page
    .locator('body')
    .getByText(pattern)
    .first()
    .isVisible()
    .catch(() => false)

  // Print whether optional detail exists
  console.log(`${label} available for "${resultName}": ${isVisible}`)

  // Return availability boolean
  return isVisible
}

// Wait for snapshot, image, or video to load if the selected detail panel provides one
// This is intentionally a soft/quick check so the full loop does not timeout
async function waitForSnapshotOrVideoIfAvailable(
  page: Page,
  resultName: string,
  mediaCountBeforeClick: number
): Promise<void> {
  // Give the detail panel a short moment to render media
  await page.waitForTimeout(WAIT_TIMES.shortWait)

  // Count media elements after clicking the card
  const mediaCountAfterClick = await page.locator('img, video').count()

  // If no new media appeared, log and continue
  if (mediaCountAfterClick <= mediaCountBeforeClick) {
    console.log(`No new snapshot/video appeared for "${resultName}"`)
    return
  }

  // Soft-check if any image or video is loaded
  const mediaLoaded = await page
    .waitForFunction(
      () => {
        // Get all image elements
        const images = Array.from(document.querySelectorAll('img'))

        // Get all video elements
        const videos = Array.from(document.querySelectorAll('video'))

        // Check if any image loaded
        const imageLoaded = images.some((image) => {
          return image.complete && image.naturalWidth > 0
        })

        // Check if any video loaded enough to render
        const videoLoaded = videos.some((video) => {
          return video.readyState >= 2
        })

        // Return true if image or video is ready
        return imageLoaded || videoLoaded
      },
      undefined,
      {
        timeout: WAIT_TIMES.mediaLoadTimeout,
      }
    )
    .then(() => true)
    .catch(() => false)

  // Log media result without failing the test
  console.log(`Snapshot/video loaded for "${resultName}": ${mediaLoaded}`)
}

// Verify selected Gauge detail panel loaded after clicking a Gauge result
async function verifyGaugeDetailPanel(
  page: Page,
  resultName: string,
  mediaCountBeforeClick: number
) {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify selected Gauge result heading is visible
  await expect(app.resultHeadingByName(resultName)).toBeVisible({
    timeout: WAIT_TIMES.detailLoadTimeout,
  })

  // Verify Gauge-related detail content is present
  await expect(app.body()).toContainText(TEXT_PATTERNS.gaugeDetails, {
    timeout: WAIT_TIMES.detailLoadTimeout,
  })

  // Verify Gauge reading/value is showing somewhere in the detail page/panel
  await expect(app.body()).toContainText(TEXT_PATTERNS.gaugeReading, {
    timeout: WAIT_TIMES.detailLoadTimeout,
  })

  // Soft-check Last Updated text if available
  await softCheckDetailText(
    page,
    'Last updated text',
    TEXT_PATTERNS.lastUpdated,
    resultName
  )

  // Soft-check Current Snapshot/Image text if available
  await softCheckDetailText(
    page,
    'Current snapshot/image',
    TEXT_PATTERNS.currentSnapshot,
    resultName
  )

  // Wait for snapshot/image/video if available
  await waitForSnapshotOrVideoIfAvailable(
    page,
    resultName,
    mediaCountBeforeClick
  )

  // Check if Graph button/tab is available
  const graphVisible = await app
    .graphButtonOrTab()
    .isVisible()
    .catch(() => false)

  // Click Graph if available
  if (graphVisible) {
    // Click Graph view
    await app.graphButtonOrTab().click()

    // Wait briefly after switching view
    await page.waitForTimeout(WAIT_TIMES.shortWait)

    // Verify graph-related content is present
    await expect(app.body()).toContainText(TEXT_PATTERNS.graphView, {
      timeout: WAIT_TIMES.detailLoadTimeout,
    })

    // Print Graph verification result
    console.log(`Graph view verified for Gauge result: ${resultName}`)
  } else {
    // Print Graph not available
    console.log(`Graph view not available for Gauge result: ${resultName}`)
  }

  // Check if Table button/tab is available
  const tableVisible = await app
    .tableButtonOrTab()
    .isVisible()
    .catch(() => false)

  // Click Table if available
  if (tableVisible) {
    // Click Table view
    await app.tableButtonOrTab().click()

    // Wait briefly after switching view
    await page.waitForTimeout(WAIT_TIMES.shortWait)

    // Verify table-related content is present
    await expect(app.body()).toContainText(TEXT_PATTERNS.tableView, {
      timeout: WAIT_TIMES.detailLoadTimeout,
    })

    // Print Table verification result
    console.log(`Table view verified for Gauge result: ${resultName}`)
  } else {
    // Print Table not available
    console.log(`Table view not available for Gauge result: ${resultName}`)
  }

  // Print successful Gauge detail verification
  console.log(`Gauge detail panel verified: ${resultName}`)
}

// Verify selected Camera detail panel loaded after clicking a Camera result
async function verifyCameraDetailPanel(
  page: Page,
  resultName: string,
  mediaCountBeforeClick: number
) {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify selected Camera result heading is visible
  await expect(app.resultHeadingByName(resultName)).toBeVisible({
    timeout: WAIT_TIMES.detailLoadTimeout,
  })

  // Verify Camera-related detail content is present
  await expect(app.body()).toContainText(TEXT_PATTERNS.cameraDetails, {
    timeout: WAIT_TIMES.detailLoadTimeout,
  })

  // Soft-check Current Snapshot/Image text if available
  await softCheckDetailText(
    page,
    'Camera snapshot/image',
    TEXT_PATTERNS.currentSnapshot,
    resultName
  )

  // Soft-check Last Updated text if available
  await softCheckDetailText(
    page,
    'Camera last updated text',
    TEXT_PATTERNS.lastUpdated,
    resultName
  )

  // Wait for snapshot/image/video if available
  await waitForSnapshotOrVideoIfAvailable(
    page,
    resultName,
    mediaCountBeforeClick
  )

  // Print successful Camera detail verification
  console.log(`Camera detail panel verified: ${resultName}`)
}

// Close selected result detail panel using the X close button
async function closeSelectedResultPanel(page: Page) {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Give detail panel a moment before looking for close button
  await page.waitForTimeout(WAIT_TIMES.shortWait)

  // Try common accessible close button first
  const closeByLabelVisible = await app
    .closeResultButtonByLabel()
    .isVisible()
    .catch(() => false)

  // Click accessible close button if visible
  if (closeByLabelVisible) {
    await app.closeResultButtonByLabel().click()

    // Wait after closing detail panel
    await page.waitForTimeout(WAIT_TIMES.mediumWait)

    // Wait until search area is ready again
    await waitForSearchAreaReady(page)

    return
  }

  // Try visible X button fallback
  const closeByTextVisible = await app
    .closeResultButtonByText()
    .isVisible()
    .catch(() => false)

  // Click X close button if visible
  if (closeByTextVisible) {
    await app.closeResultButtonByText().click()

    // Wait after closing detail panel
    await page.waitForTimeout(WAIT_TIMES.mediumWait)

    // Wait until search area is ready again
    await waitForSearchAreaReady(page)

    return
  }

  // If no close button is found, fail with clear error
  throw new Error(
    'Could not find the selected result close button. Run Playwright codegen or inspect the X button aria-label/class.'
  )
}

// Click a result card and verify it loads without expecting URL change
async function clickAndVerifyResultCard(
  page: Page,
  card: Locator,
  resultName: string,
  resultType: 'Gauge' | 'Camera'
) {
  // Count media elements before clicking the result card
  const mediaCountBeforeClick = await page.locator('img, video').count()

  // Scroll result card into view
  await card.scrollIntoViewIfNeeded()

  // Small wait after scrolling
  await page.waitForTimeout(WAIT_TIMES.shortWait)

  // Click the result card
  await card.click()

  // Verify selected result detail panel based on result type
  if (resultType === 'Gauge') {
    // Verify Gauge detail panel
    await verifyGaugeDetailPanel(page, resultName, mediaCountBeforeClick)
  }

  // Verify Camera detail panel based on result type
  if (resultType === 'Camera') {
    // Verify Camera detail panel
    await verifyCameraDetailPanel(page, resultName, mediaCountBeforeClick)
  }

  // Give the app a short moment after selected result is confirmed
  await page.waitForTimeout(WAIT_TIMES.shortWait)

  // Print successful click verification
  console.log(`Clicked and verified ${resultType} result loaded: ${resultName}`)

  // Close selected result panel before trying the next result
  await closeSelectedResultPanel(page)

  // Wait briefly after close before next loop
  await page.waitForTimeout(WAIT_TIMES.shortWait)

  // Verify search area is ready again after closing selected result
  await waitForSearchAreaReady(page)
}

// =====================================================
// SHARED TEST SETUP
// =====================================================

// Run this setup before every test
test.beforeEach(async ({ page, context }, testInfo) => {
  // Allow geolocation for this app so Chrome does not show the location permission popup
  await context.grantPermissions(['geolocation'], {
    // Use the origin from APP_URL so we do not need a separate ORIGIN variable
    origin: new URL(APP_URL).origin,
  })

  // Open the Flood Monitoring app
  await page.goto(APP_URL, {
    // Wait until the initial HTML document is loaded
    waitUntil: 'domcontentloaded',
  })

  // Wait for network activity to settle, but do not fail if the app keeps polling
  await page.waitForLoadState('networkidle').catch(() => {})

  // Close About tooltip if it opens automatically and blocks clicks
  await closeAboutTooltipIfOpen(page)

  // Show the current test name on the browser page
  await showTestNameOnPage(page, testInfo.title)
})

// =====================================================
// RESULT CARD LOOP TEST
// =====================================================

// Test searching, finding visible results, clicking a limited number of visible results, verifying they load, closing them, and continuing
test('Visible Gauge and Camera results can be clicked and detail panels verified', async ({
  page,
}) => {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Reset filter to All so both Gauge and Camera results can appear
  await resetFilterToAll(page)

  // Search for results and check if result cards exist
  const hasResults = await searchByValue(page, TEST_DATA.resultSearchValue)

  // If no result cards are found, log the message and end the test gracefully
  if (!hasResults) {
    // Create no-results message
    const noResultsMessage = `No results found for search value: ${TEST_DATA.resultSearchValue}`

    // Print no-results message in terminal
    console.log(noResultsMessage)

    // Add no-results note to the Playwright report
    test.info().annotations.push({
      type: 'no-results',
      description: noResultsMessage,
    })

    // End test without failing
    return
  }

  // Wait until result cards are ready because this search has results
  await waitForResultCardsReady(page)

  // Get only visible result names after search
  const visibleResultNames: string[] = await getVisibleResultNames(page)

  // If result cards exist but none are visible, log the message and end the test gracefully
  if (visibleResultNames.length === 0) {
    // Create no-visible-results message
    const noVisibleResultsMessage = `No visible result cards found for search value: ${TEST_DATA.resultSearchValue}`

    // Print no-visible-results message in terminal
    console.log(noVisibleResultsMessage)

    // Add no-visible-results note to the Playwright report
    test.info().annotations.push({
      type: 'no-visible-results',
      description: noVisibleResultsMessage,
    })

    // End test without failing
    return
  }

  // Print visible result count in terminal
  console.log(`Visible result cards found: ${visibleResultNames.length}`)

  // Limit how many results this test will verify
  const resultNamesToVerify = visibleResultNames.slice(
    0,
    TEST_DATA.maxResultsToVerify
  )

  // Print limited result count in terminal
  console.log(
    `Verifying ${resultNamesToVerify.length} of ${visibleResultNames.length} visible results`
  )

  // Track how many Gauge results were verified
  let gaugeCount = 0

  // Track how many Camera results were verified
  let cameraCount = 0

  // Loop through only the limited result names
  for (let index = 0; index < resultNamesToVerify.length; index++) {
    // Get current result name from the limited results list
    const resultName: string = resultNamesToVerify[index]

    // Print which result is being tested
    console.log(
      `Checking visible result ${index + 1} of ${resultNamesToVerify.length}: ${resultName}`
    )

    // Re-query card by result name because clicking/closing can cause DOM updates
    const currentCard = app.resultCardByName(resultName)

    // Scroll current card into view and verify it is visible
    await prepareResultCardForTesting(currentCard)

    // Check whether the card is Gauge
    const gaugeCard = await isGaugeCard(currentCard)

    // Check whether the card is Camera
    const cameraCard = await isCameraCard(currentCard)

    // Verify Gauge result
    if (gaugeCard) {
      // Increase Gauge count
      gaugeCount++

      // Verify Gauge card details before click
      await verifyGaugeCard(currentCard, resultName)

      // Click Gauge card, verify selected Gauge details load, then close panel
      await clickAndVerifyResultCard(page, currentCard, resultName, 'Gauge')
    }

    // Verify Camera result
    else if (cameraCard) {
      // Increase Camera count
      cameraCount++

      // Verify Camera card details before click
      await verifyCameraCard(currentCard, resultName)

      // Click Camera card, verify selected Camera details load, then close panel
      await clickAndVerifyResultCard(page, currentCard, resultName, 'Camera')
    }

    // Fail if card is neither Gauge nor Camera
    else {
      throw new Error(
        `Result card "${resultName}" is neither Gauge nor Camera.`
      )
    }

    // Wait before moving to the next result card
    await page.waitForTimeout(WAIT_TIMES.shortWait)
  }

  // Print totals in terminal
  console.log(`Gauge results verified: ${gaugeCount}`)
  console.log(`Camera results verified: ${cameraCount}`)

  // Calculate total verified result cards
  const totalVerifiedResults = gaugeCount + cameraCount

  // Verify at least one visible result was verified
  expect(totalVerifiedResults).toBeGreaterThan(0)

  // If no Gauge results were found, log it instead of failing
  if (gaugeCount === 0) {
    // Create no-gauge message
    const noGaugeMessage = `No Gauge results found for search value: ${TEST_DATA.resultSearchValue}`

    // Print no-gauge message in terminal
    console.log(noGaugeMessage)

    // Add no-gauge note to Playwright report
    test.info().annotations.push({
      type: 'no-gauge-results',
      description: noGaugeMessage,
    })
  }

  // If no Camera results were found, log it instead of failing
  if (cameraCount === 0) {
    // Create no-camera message
    const noCameraMessage = `No Camera results found for search value: ${TEST_DATA.resultSearchValue}`

    // Print no-camera message in terminal
    console.log(noCameraMessage)

    // Add no-camera note to Playwright report
    test.info().annotations.push({
      type: 'no-camera-results',
      description: noCameraMessage,
    })
  }
})
