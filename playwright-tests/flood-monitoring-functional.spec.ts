// Import Playwright test runner, assertion library, and Page type
import { test, expect, Page } from '@playwright/test'

// Give this file more time because some tests loop through multiple ZIP codes
test.setTimeout(120000)

// Store the app URL in one place so it is easy to update later
const APP_URL = 'https://flood-monitoring-test.phila.gov/'

// =====================================================
// CENTRALIZED TEXT / EXPECTED VALUES
// Update these if page text changes later.
// =====================================================

// Store expected page text values in one object
const APP_TEXT = {
  // Expected browser tab title
  pageTitle: /Flood Monitoring Map/i,

  // Expected main heading text
  heading: 'Flood Monitoring Map',

  // Expected About tooltip title
  aboutTitle: 'About this tool',

  // Expected About tooltip body text
  aboutDescription: /This map allows residents to keep an eye on water levels/i,

  // Expected Resources page text
  resourcesText: /resources/i,
}

// =====================================================
// CENTRALIZED TEST DATA
// Update these if you want to test different search values.
// =====================================================

// Store test search values in one object
const TEST_DATA = {
  // Valid keyword search
  validKeywordSearch: 'Cobbs Creek',

  // First search used before ZIP search
  firstMileageSearch: 'Darby Creek',

  // Single ZIP code search used in clear/reuse test
  zipCodeSearch: '19107',

  // Multiple Philadelphia ZIP codes used to verify mileage updates
  philadelphiaZipCodes: ['19107', '19131', '19139', '19104', '19146'],
}

// =====================================================
// CENTRALIZED ROLE NAMES
// Update these if button/link/input accessible names change later.
// =====================================================

// Store accessible role names in one object
const ROLES = {
  // Search textbox accessible name
  // Regex makes this work for both old and new app labels
  searchTextboxName: /Search by address.*keyword/i,

  // Search button accessible name
  searchButtonName: 'Search',

  // All filter button name
  allFilterName: 'All',

  // Gauge filter button name
  gaugeFilterName: 'Gauge',

  // Camera filter button name
  cameraFilterName: 'Camera',

  // About/info button accessible name
  infoButtonName: 'More information',

  // Tooltip dismiss button accessible name
  dismissTooltipName: 'Dismiss tooltip',

  // Imagery toggle button name
  imageryButtonName: 'Toggle Imagery',

  // Show my location button name
  // This may not always be exposed by the app, so the test handles it softly
  locationButtonName: 'Show my location',
}

// =====================================================
// CSS SELECTORS ONLY WHERE ROLE IS NOT AVAILABLE
// MapLibre controls and layout containers usually do not have clean roles.
// =====================================================

// Store CSS selectors in one object
const CSS = {
  // Main finder panel selector
  finderPanel: '.finder-panel',

  // Left side location list selector
  locationList: '.location-list',

  // Map zoom-in control selector
  zoomIn: '.maplibregl-ctrl-zoom-in',

  // Map zoom-out control selector
  zoomOut: '.maplibregl-ctrl-zoom-out',
}

// =====================================================
// PAGE OBJECT STYLE HELPERS
// Tests call these instead of repeating locators.
// =====================================================

// Create a helper object that returns locators for the Flood Monitoring app
const floodMonitoringApp = (page: Page) => ({
  // Main page heading locator
  heading: () => page.getByText(APP_TEXT.heading).first(),

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

  // Gauge filter button locator scoped inside the top filter group
  gaugeFilter: () =>
    page.getByRole('group').getByRole('button', {
      name: ROLES.gaugeFilterName,
    }),

  // Camera filter button locator scoped inside the top filter group
  cameraFilter: () =>
    page.getByRole('group').getByRole('button', {
      name: ROLES.cameraFilterName,
    }),

  // Main finder panel locator
  finderPanel: () => page.locator(CSS.finderPanel).first(),

  // Location list locator
  // .first() is needed because the app renders more than one .location-list element
  locationList: () => page.locator(CSS.locationList).first(),

  // Mileage text locator inside the location list
  milesText: () =>
    page
      .locator(CSS.locationList)
      .first()
      .getByText(/\d+(\.\d+)? mi/),

  // Map zoom-in button locator
  zoomIn: () => page.locator(CSS.zoomIn).first(),

  // Map zoom-out button locator
  zoomOut: () => page.locator(CSS.zoomOut).first(),

  // About/info button locator
  infoButton: () => page.getByRole('button', { name: ROLES.infoButtonName }),

  // About tooltip heading locator
  aboutTitle: () =>
    page.getByRole('heading', {
      name: APP_TEXT.aboutTitle,
      level: 6,
    }),

  // Dismiss tooltip button locator
  dismissTooltipButton: () =>
    page.getByRole('button', { name: ROLES.dismissTooltipName }),

  // Learn more link inside About tooltip
  learnMoreLink: () => page.getByRole('link', { name: 'Learn more' }),

  // Imagery toggle button locator
  imageryButton: () =>
    page.getByRole('button', { name: ROLES.imageryButtonName }),

  // Show my location button locator
  // This locator may not always exist depending on the app state
  locationButton: () =>
    page.getByRole('button', { name: ROLES.locationButtonName }),

  // Terms of use footer link locator
  termsOfUseFooterLink: () => page.getByRole('link', { name: 'Terms of use' }),

  // Right to know footer link locator
  rightToKnowFooterLink: () =>
    page.getByRole('link', { name: 'Right to know' }),

  // Privacy Policy footer link locator
  privacyPolicyFooterLink: () =>
    page.getByRole('link', { name: 'Privacy Policy' }),

  // Accessibility footer link locator
  accessibilityFooterLink: () =>
    page.getByRole('link', { name: 'Accessibility' }),

  // Feedback footer link locator
  feedbackFooterLink: () => page.getByRole('link', { name: 'Feedback' }),
})

// =====================================================
// SHARED HELPERS
// =====================================================

// Close About tooltip if it is open and blocking clicks
async function closeAboutTooltipIfOpen(page: Page) {
  // Get the dismiss tooltip button
  const dismissButton = page.getByRole('button', {
    name: ROLES.dismissTooltipName,
  })

  // Check if the dismiss button is visible
  const isDismissVisible = await dismissButton.isVisible().catch(() => false)

  // If the tooltip is open, close it
  if (isDismissVisible) {
    await dismissButton.click()
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

    // Create a new banner element
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

// Get all visible mileage values from the location list
async function getMilesText(page: Page): Promise<string[]> {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Wait until at least one mileage value is visible
  await expect(app.milesText().first()).toBeVisible()

  // Read all mileage values from the list
  const milesValues = await app.milesText().allInnerTexts()

  // Normalize and return mileage values
  return milesValues.map((value: string) => value.trim()).filter(Boolean)
}

// Search by keyword or ZIP code
async function searchByValue(page: Page, searchValue: string) {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify search field is visible before using it
  await expect(app.searchBox()).toBeVisible()

  // Clear the search field
  await app.searchBox().fill('')

  // Enter the new search value
  await app.searchBox().fill(searchValue)

  // Click the Search button
  await app.searchButton().click()

  // Verify search value remains in the search box
  await expect(app.searchBox()).toHaveValue(searchValue)

  // Verify finder panel remains visible after search
  await expect(app.finderPanel()).toBeVisible()
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

  // Close About tooltip if it opens automatically and blocks map buttons
  await closeAboutTooltipIfOpen(page)

  // Show the current test name on the browser page
  await showTestNameOnPage(page, testInfo.title)
})

// =====================================================
// FUNCTIONAL TESTS
// =====================================================

// Test that the main landing page loads with the core UI elements
test('Landing page displays main flood monitoring elements', async ({
  page,
}) => {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify browser tab title
  await expect(page).toHaveTitle(APP_TEXT.pageTitle)

  // Verify main heading is visible
  await expect(app.heading()).toBeVisible()

  // Verify search textbox is visible
  await expect(app.searchBox()).toBeVisible()

  // Verify search button is visible
  await expect(app.searchButton()).toBeVisible()

  // Verify filter group is visible
  await expect(app.filterGroup()).toBeVisible()

  // Verify All filter is visible
  await expect(app.allFilter()).toBeVisible()

  // Verify Gauge filter is visible
  await expect(app.gaugeFilter()).toBeVisible()

  // Verify Camera filter is visible
  await expect(app.cameraFilter()).toBeVisible()

  // Verify main finder panel is visible
  await expect(app.finderPanel()).toBeVisible()

  // Verify location list container is visible
  await expect(app.locationList()).toBeVisible()

  // Verify mileage values are visible in the location list
  await expect(app.milesText().first()).toBeVisible()

  // Verify map zoom-in control is visible
  await expect(app.zoomIn()).toBeVisible()

  // Verify map zoom-out control is visible
  await expect(app.zoomOut()).toBeVisible()
})

// Test that the About tooltip opens and closes correctly
test('About this tool tooltip opens and can be dismissed', async ({ page }) => {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Close tooltip first so this test starts clean
  await closeAboutTooltipIfOpen(page)

  // Verify About/info button is visible
  await expect(app.infoButton()).toBeVisible()

  // Click the About/info button
  await app.infoButton().click()

  // Show the test banner again in case UI changes affected it
  await showTestNameOnPage(
    page,
    'About this tool tooltip opens and can be dismissed'
  )

  // Verify About tooltip heading is visible
  await expect(app.aboutTitle()).toBeVisible()

  // Verify tooltip contains expected description text
  await expect(page.locator('body')).toContainText(APP_TEXT.aboutDescription)

  // Verify dismiss tooltip button is visible
  await expect(app.dismissTooltipButton()).toBeVisible()

  // Click dismiss tooltip button
  await app.dismissTooltipButton().click()

  // Verify tooltip heading is hidden after dismissing
  await expect(app.aboutTitle()).toBeHidden()
})

// Test that the Learn more link inside About tooltip navigates to Resources page
test('Learn more link navigates to resources page', async ({ page }) => {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Close tooltip first so this test starts clean
  await closeAboutTooltipIfOpen(page)

  // Verify About/info button is visible
  await expect(app.infoButton()).toBeVisible()

  // Open About tooltip
  await app.infoButton().click()

  // Verify Learn more link is visible
  await expect(app.learnMoreLink()).toBeVisible()

  // Click Learn more link
  await app.learnMoreLink().click()

  // Verify URL contains resources
  await expect(page).toHaveURL(/resources/i)

  // Verify page body contains resources text
  await expect(page.locator('body')).toContainText(APP_TEXT.resourcesText)
})

// Test that search accepts a valid keyword
test('Search accepts a valid address or keyword', async ({ page }) => {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify search textbox is visible
  await expect(app.searchBox()).toBeVisible()

  // Type a valid search keyword
  await searchByValue(page, TEST_DATA.validKeywordSearch)

  // Verify search box keeps the entered value
  await expect(app.searchBox()).toHaveValue(TEST_DATA.validKeywordSearch)

  // Verify finder panel is still visible after search
  await expect(app.finderPanel()).toBeVisible()
})

// Test that search can be cleared, reused, and ZIP code updates mileage
test('Search can be cleared and reused with ZIP code mileage update', async ({
  page,
}) => {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify search textbox is visible
  await expect(app.searchBox()).toBeVisible()

  // Enter first search value
  await searchByValue(page, TEST_DATA.firstMileageSearch)

  // Capture mileage values after first search
  const milesAfterFirstSearch = await getMilesText(page)

  // Print mileage values after first search in terminal
  console.log(
    `Miles after ${TEST_DATA.firstMileageSearch} search:`,
    milesAfterFirstSearch
  )

  // Enter ZIP code search value
  await searchByValue(page, TEST_DATA.zipCodeSearch)

  // Capture mileage values after ZIP code search
  const milesAfterZipSearch = await getMilesText(page)

  // Print mileage values after ZIP code search in terminal
  console.log(
    `Miles after ${TEST_DATA.zipCodeSearch} ZIP search:`,
    milesAfterZipSearch
  )

  // Verify finder panel is still visible after ZIP code search
  await expect(app.finderPanel()).toBeVisible()

  // Verify mileage values changed after entering ZIP code
  expect(milesAfterZipSearch).not.toEqual(milesAfterFirstSearch)
})

// Test that multiple Philadelphia ZIP code searches update mileage values
test('Multiple Philadelphia ZIP code searches update mileage values', async ({
  page,
}) => {
  // Store the previous ZIP code mileage values for comparison
  let previousMilesValues: string[] | null = null

  // Loop through each Philadelphia ZIP code
  for (const zipCode of TEST_DATA.philadelphiaZipCodes) {
    // Search by current ZIP code
    await searchByValue(page, zipCode)

    // Capture mileage values after current ZIP code search
    const currentMilesValues = await getMilesText(page)

    // Print current ZIP code and mileage values in terminal
    console.log(`Miles after ${zipCode} ZIP search:`, currentMilesValues)

    // Verify at least one mileage value is visible for the ZIP code
    expect(currentMilesValues.length).toBeGreaterThan(0)

    // Compare current ZIP mileage values with previous ZIP mileage values
    if (previousMilesValues) {
      // Verify mileage values changed between ZIP code searches
      expect(currentMilesValues).not.toEqual(previousMilesValues)
    }

    // Save current mileage values for the next loop comparison
    previousMilesValues = currentMilesValues
  }
})

// Test that the Gauge filter can be selected
test('Gauge filter can be selected', async ({ page }) => {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify Gauge filter button is visible
  await expect(app.gaugeFilter()).toBeVisible()

  // Click Gauge filter button
  await app.gaugeFilter().click()

  // Verify Gauge button receives selected class
  await expect(app.gaugeFilter()).toHaveClass(/is-selected/)
})

// Test that the Camera filter can be selected
test('Camera filter can be selected', async ({ page }) => {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify Camera filter button is visible
  await expect(app.cameraFilter()).toBeVisible()

  // Click Camera filter button
  await app.cameraFilter().click()

  // Verify Camera button receives selected class
  await expect(app.cameraFilter()).toHaveClass(/is-selected/)
})

// Test that All filter can be selected after another filter
test('All filter can be selected after choosing another filter', async ({
  page,
}) => {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify Gauge filter is visible
  await expect(app.gaugeFilter()).toBeVisible()

  // Verify All filter is visible
  await expect(app.allFilter()).toBeVisible()

  // Click Gauge filter first
  await app.gaugeFilter().click()

  // Verify Gauge filter becomes selected
  await expect(app.gaugeFilter()).toHaveClass(/is-selected/)

  // Click All filter
  await app.allFilter().click()

  // Verify All filter becomes selected
  await expect(app.allFilter()).toHaveClass(/is-selected/)
})

// Test that map zoom controls are visible and clickable
test('Map zoom controls work', async ({ page }) => {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify zoom-in button is visible
  await expect(app.zoomIn()).toBeVisible()

  // Verify zoom-out button is visible
  await expect(app.zoomOut()).toBeVisible()

  // Click zoom-in button
  await app.zoomIn().click()

  // Small wait so map has time to respond
  await page.waitForTimeout(300)

  // Click zoom-out button
  await app.zoomOut().click()

  // Small wait so map has time to respond
  await page.waitForTimeout(300)

  // Verify zoom-in button is still visible
  await expect(app.zoomIn()).toBeVisible()

  // Verify zoom-out button is still visible
  await expect(app.zoomOut()).toBeVisible()
})

// Test that imagery toggle is visible and clickable
test('Imagery toggle is available and clickable', async ({ page }) => {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Close tooltip if it is covering the imagery button
  await closeAboutTooltipIfOpen(page)

  // Verify imagery toggle button is visible
  await expect(app.imageryButton()).toBeVisible()

  // Click imagery toggle button
  await app.imageryButton().click()

  // Verify imagery toggle button is still visible after click
  await expect(app.imageryButton()).toBeVisible()
})

// Test that Show my location button is visible and clickable if the app provides it
test('Show my location button is available and clickable if present', async ({
  page,
}) => {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Close tooltip if it is covering the map controls
  await closeAboutTooltipIfOpen(page)

  // Check if Show my location button is visible
  const isLocationButtonVisible = await app
    .locationButton()
    .isVisible()
    .catch(() => false)

  // If the button is not available, log it and end test gracefully
  if (!isLocationButtonVisible) {
    // Create message
    const message = 'Show my location button was not found on this app state.'

    // Print message in terminal
    console.log(message)

    // Add note to Playwright report
    test.info().annotations.push({
      type: 'optional-control-missing',
      description: message,
    })

    // End test without failing
    return
  }

  // Click Show my location button if it exists
  await app.locationButton().click()

  // Verify Show my location button is still visible after click
  await expect(app.locationButton()).toBeVisible()
})

// Test that footer links are visible
test('Footer links are visible', async ({ page }) => {
  // Create locator helper object
  const app = floodMonitoringApp(page)

  // Verify Terms of use footer link is visible
  await expect(app.termsOfUseFooterLink()).toBeVisible()

  // Verify Right to know footer link is visible
  await expect(app.rightToKnowFooterLink()).toBeVisible()

  // Verify Privacy Policy footer link is visible
  await expect(app.privacyPolicyFooterLink()).toBeVisible()

  // Verify Accessibility footer link is visible
  await expect(app.accessibilityFooterLink()).toBeVisible()

  // Verify Feedback footer link is visible
  await expect(app.feedbackFooterLink()).toBeVisible()
})
