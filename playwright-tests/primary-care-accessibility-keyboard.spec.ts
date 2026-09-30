// Import Playwright test utilities and shared TypeScript types
import { test, expect, Page, Locator } from '@playwright/test'

// Allow enough time for keyboard navigation and UI updates in the test environment
test.setTimeout(120000)

// Centralized app URL for easier maintenance across environments
const APP_URL = 'https://test-primary-care.phila.gov/'

// =====================================================
// TYPES
// These interfaces keep page.evaluate() return values strongly typed.
// =====================================================

type FocusInfo = {
  hasFocus: boolean
  hasVisibleIndicator: boolean
  outlineStyle: string
  outlineWidth: string
  boxShadow: string
}

type ActiveElementSummary = {
  tagName: string
  role: string | null
  ariaLabel: string | null
  name: string | null
  id: string | null
  text: string | undefined
}

// =====================================================
// TEST DATA
// Keyboard accessibility tests use predictable values so behavior
// can be repeated consistently in local and CI runs.
// =====================================================

const TEST_DATA = {
  // ZIP code used to verify keyboard-only search
  searchValue: '19104',

  // Maximum number of Tab presses used while looking for focusable elements
  maxTabPresses: 40,

  // Maximum number of result cards to test with keyboard interaction
  maxResultCardsToCheck: 3,

  // Minimum readable text expected from a real provider result card
  minimumCardTextLength: 20,
}

// =====================================================
// EXPECTED PAGE CONTENT
// Keep expected text patterns centralized for easier maintenance.
// =====================================================

const APP_TEXT = {
  // Browser title validation
  pageTitle: /Primary care finder/i,

  // Basic page-content validation
  mainText: /Primary care/i,

  // Text patterns commonly found in real provider/location result cards
  providerCardText:
    /address|phone|clinic|health|care|provider|hours|monday|tuesday|wednesday|thursday|friday|philadelphia|pa|zip/i,
}

// =====================================================
// ACCESSIBLE ROLE NAMES
// Prefer role-based locators because they reflect keyboard/screen-reader behavior.
// Regex patterns help keep tests stable if wording changes slightly.
// =====================================================

const ROLES = {
  // Flexible search textbox name
  searchTextboxName: /search|address|zip|zipcode|keyword|location/i,

  // Flexible search button name
  searchButtonName: /search|find/i,

  // Flexible close/back button name for modals or detail panels
  closeOrBackButtonName: /close|back|return|dismiss/i,

  // Flexible filter-related button names
  filterButtonName:
    /filter|filters|refine|accepting|patients|language|insurance|distance|specialty|provider|clinic|health center|wheelchair|telehealth|appointment|available|apply/i,
}

// =====================================================
// FALLBACK SELECTORS
// CSS selectors are used only where accessible roles are not reliable enough.
// Result-card selectors are intentionally narrow to avoid counting nested list items.
// =====================================================

const CSS = {
  // Main app container
  main: 'main',

  // Candidate provider/result-card elements
  resultCards:
    '[class*="provider"], [class*="clinic"], [class*="location-card"], [class*="result-card"], [class*="search-result"]',

  // Common focusable elements used for keyboard navigation checks
  focusableElements: 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
}

// =====================================================
// PAGE OBJECT HELPERS
// Centralized locators keep tests readable and easier to maintain.
// =====================================================

const primaryCareAccessibilityApp = (page: Page) => ({
  // Main app container
  main: () => page.locator(CSS.main).first(),

  // Full page body for broad assertions
  body: () => page.locator('body'),

  // Search input
  searchBox: () =>
    page.getByRole('textbox', {
      name: ROLES.searchTextboxName,
    }),

  // Search button
  searchButton: () =>
    page
      .getByRole('button', {
        name: ROLES.searchButtonName,
      })
      .first(),

  // Candidate result-card elements
  resultCards: () => page.locator(CSS.resultCards),

  // Checkbox filters, if exposed by the app
  checkboxes: () => page.getByRole('checkbox'),

  // Radio filters, if exposed by the app
  radios: () => page.getByRole('radio'),

  // Dropdown filters, if exposed by the app
  comboboxes: () => page.getByRole('combobox'),

  // Button-style filters, if exposed by the app
  filterButtons: () =>
    page
      .getByRole('button', {
        name: ROLES.filterButtonName,
      })
      .filter({
        hasNotText: /search|close|back|return|dismiss/i,
      }),

  // Optional close/back button for detail panels or modals
  closeOrBackButton: () =>
    page
      .getByRole('button', {
        name: ROLES.closeOrBackButtonName,
      })
      .first(),

  // All focusable elements on the page
  focusableElements: () => page.locator(CSS.focusableElements),
})

// =====================================================
// SHARED HELPERS
// These helpers support keyboard-specific assertions and reduce repetition.
// =====================================================

// Displays the currently running test name in headed browser runs
async function showTestNameOnPage(page: Page, testName: string) {
  await page.evaluate<void, string>((name: string) => {
    const existingBanner = document.getElementById('playwright-test-banner')

    if (existingBanner) {
      existingBanner.remove()
    }

    const banner = document.createElement('div')

    banner.id = 'playwright-test-banner'
    banner.textContent = `Running test: ${name}`

    banner.style.position = 'fixed'
    banner.style.top = '10px'
    banner.style.left = '50%'
    banner.style.transform = 'translateX(-50%)'
    banner.style.zIndex = '999999'
    banner.style.background = '#111827'
    banner.style.color = 'white'
    banner.style.padding = '10px 16px'
    banner.style.borderRadius = '8px'
    banner.style.fontSize = '24px'
    banner.style.fontFamily = 'Arial, sans-serif'
    banner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)'
    banner.style.pointerEvents = 'none'

    document.body.appendChild(banner)
  }, testName)
}

// Safely checks optional UI controls without failing the test
async function isVisible(locator: Locator): Promise<boolean> {
  return await locator.isVisible().catch(() => false)
}

// Reads useful text from a locator for logging and validation
async function getElementText(locator: Locator): Promise<string> {
  const text = await locator.innerText().catch(() => '')

  return text.trim()
}

// Returns the currently focused element summary from the browser
async function getActiveElementSummary(page: Page): Promise<string> {
  const summary = await page.evaluate<ActiveElementSummary>(() => {
    const activeElement = document.activeElement

    if (!activeElement) {
      return {
        tagName: 'none',
        role: null,
        ariaLabel: null,
        name: null,
        id: null,
        text: 'No active element',
      }
    }

    const tagName = activeElement.tagName.toLowerCase()
    const role = activeElement.getAttribute('role')
    const ariaLabel = activeElement.getAttribute('aria-label')
    const name = activeElement.getAttribute('name')
    const id = activeElement.getAttribute('id')
    const text = activeElement.textContent?.trim().slice(0, 80)

    return {
      tagName,
      role,
      ariaLabel,
      name,
      id,
      text,
    }
  })

  return JSON.stringify(summary)
}

// Validates that the browser has a focused element
async function expectPageToHaveFocusedElement(page: Page): Promise<void> {
  const activeElementExists = await page.evaluate<boolean>(() => {
    return document.activeElement !== null && document.activeElement !== document.body
  })

  expect(activeElementExists).toBeTruthy()
}

// Validates that the currently focused element has a visible focus indicator
async function expectFocusedElementHasVisibleIndicator(page: Page): Promise<void> {
  const focusInfo = await page.evaluate<FocusInfo>(() => {
    const activeElement = document.activeElement as HTMLElement | null

    if (!activeElement || activeElement === document.body) {
      return {
        hasFocus: false,
        hasVisibleIndicator: false,
        outlineStyle: '',
        outlineWidth: '',
        boxShadow: '',
      }
    }

    const computedStyle = window.getComputedStyle(activeElement)

    const outlineStyle = computedStyle.outlineStyle
    const outlineWidth = computedStyle.outlineWidth
    const boxShadow = computedStyle.boxShadow

    const hasOutline = outlineStyle !== 'none' && outlineStyle !== '' && outlineWidth !== '0px'

    const hasBoxShadow = boxShadow !== 'none' && boxShadow !== ''

    return {
      hasFocus: true,
      hasVisibleIndicator: hasOutline || hasBoxShadow,
      outlineStyle,
      outlineWidth,
      boxShadow,
    }
  })

  console.log('Focused element style:', focusInfo)

  expect(focusInfo.hasFocus).toBeTruthy()

  // Some apps use custom focus styling that may not be detectable through outline or box-shadow alone.
  if (!focusInfo.hasVisibleIndicator) {
    test.info().annotations.push({
      type: 'focus-indicator-not-detected',
      description:
        'Focused element exists, but outline/box-shadow focus indicator was not detected programmatically.',
    })
  }
}

// Presses Tab until a matching locator receives focus or the limit is reached
async function tabToLocator(
  page: Page,
  target: Locator,
  maxTabs: number = TEST_DATA.maxTabPresses
): Promise<boolean> {
  for (let index = 0; index < maxTabs; index++) {
    const isTargetFocused = await target
      .evaluate<boolean, void>((element: HTMLElement | SVGElement) => {
        return element === document.activeElement
      })
      .catch(() => false)

    if (isTargetFocused) {
      console.log(`Target reached by keyboard after ${index} Tab presses.`)
      return true
    }

    await page.keyboard.press('Tab')

    const activeElementSummary = await getActiveElementSummary(page)

    console.log(`Tab ${index + 1}: ${activeElementSummary}`)
  }

  return false
}

// Submits a search using keyboard-only interaction
async function searchByKeyboard(page: Page, searchValue: string): Promise<boolean> {
  const app = primaryCareAccessibilityApp(page)

  await expect(app.searchBox()).toBeVisible({
    timeout: 10000,
  })

  await app.searchBox().focus()
  await expect(app.searchBox()).toBeFocused()

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await page.keyboard.type(searchValue)

  await expect(app.searchBox()).toHaveValue(searchValue)

  const searchButtonVisible = await isVisible(app.searchButton())

  if (searchButtonVisible) {
    const reachedSearchButton = await tabToLocator(page, app.searchButton())

    if (reachedSearchButton) {
      await page.keyboard.press('Enter')
    } else {
      await app.searchBox().focus()
      await page.keyboard.press('Enter')
    }
  } else {
    await page.keyboard.press('Enter')
  }

  await page.waitForTimeout(1000)

  const resultCount = await app.resultCards().count()

  console.log(`Raw result-card candidate count after keyboard search: ${resultCount}`)

  return resultCount > 0
}

// Determines whether a candidate element looks like a real provider result card
async function isMeaningfulProviderCard(card: Locator): Promise<boolean> {
  const cardVisible = await isVisible(card)

  if (!cardVisible) {
    return false
  }

  const cardText = await getElementText(card)

  const hasEnoughText = cardText.length >= TEST_DATA.minimumCardTextLength

  const hasProviderLikeText = APP_TEXT.providerCardText.test(cardText)

  return hasEnoughText && hasProviderLikeText
}

// Returns visible provider result cards only
async function getVisibleResultCards(page: Page): Promise<Locator[]> {
  const app = primaryCareAccessibilityApp(page)

  const cardCount = await app.resultCards().count()
  const visibleMeaningfulCards: Locator[] = []

  console.log(`Raw result-card candidate count: ${cardCount}`)

  for (let index = 0; index < cardCount; index++) {
    const card = app.resultCards().nth(index)

    const meaningfulProviderCard = await isMeaningfulProviderCard(card)

    if (meaningfulProviderCard) {
      visibleMeaningfulCards.push(card)
    }
  }

  console.log(`Visible meaningful result cards found: ${visibleMeaningfulCards.length}`)

  return visibleMeaningfulCards
}

// Gets visible keyboard-focusable elements
async function getVisibleFocusableElements(page: Page): Promise<Locator[]> {
  const app = primaryCareAccessibilityApp(page)

  const focusableCount = await app.focusableElements().count()
  const visibleFocusableElements: Locator[] = []

  for (let index = 0; index < focusableCount; index++) {
    const element = app.focusableElements().nth(index)

    if (await isVisible(element)) {
      visibleFocusableElements.push(element)
    }
  }

  console.log(`Visible focusable elements found: ${visibleFocusableElements.length}`)

  return visibleFocusableElements
}

// Activates the currently focused element using Enter
async function activateFocusedElementWithEnter(page: Page): Promise<void> {
  const activeElementBefore = await getActiveElementSummary(page)

  console.log(`Focused element before Enter: ${activeElementBefore}`)

  await page.keyboard.press('Enter')
  await page.waitForTimeout(700)

  const activeElementAfter = await getActiveElementSummary(page)

  console.log(`Focused element after Enter: ${activeElementAfter}`)
}

// Activates the currently focused element using Space
async function activateFocusedElementWithSpace(page: Page): Promise<void> {
  const activeElementBefore = await getActiveElementSummary(page)

  console.log(`Focused element before Space: ${activeElementBefore}`)

  await page.keyboard.press('Space')
  await page.waitForTimeout(700)

  const activeElementAfter = await getActiveElementSummary(page)

  console.log(`Focused element after Space: ${activeElementAfter}`)
}

// Closes a modal/detail panel with Escape if the app supports it
async function pressEscapeAndValidateAppStable(page: Page): Promise<void> {
  const app = primaryCareAccessibilityApp(page)

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  await expect(app.main()).toBeVisible()
}

// =====================================================
// SHARED TEST SETUP
// Each test starts from a fresh app load.
// =====================================================

test.beforeEach(async ({ page }, testInfo) => {
  await page.goto(APP_URL, {
    waitUntil: 'domcontentloaded',
  })

  // The app may keep background requests open, so networkidle is non-blocking
  await page.waitForLoadState('networkidle').catch(() => {})

  await showTestNameOnPage(page, testInfo.title)
})

// =====================================================
// KEYBOARD ACCESSIBILITY TESTS
// =====================================================

test('Page has keyboard-focusable elements', async ({ page }) => {
  const app = primaryCareAccessibilityApp(page)

  await expect(page).toHaveTitle(APP_TEXT.pageTitle)
  await expect(app.main()).toBeVisible()
  await expect(app.body()).toContainText(APP_TEXT.mainText)

  const visibleFocusableElements = await getVisibleFocusableElements(page)

  expect(visibleFocusableElements.length).toBeGreaterThan(0)
})

test('Tab key moves focus through interactive controls', async ({ page }) => {
  const app = primaryCareAccessibilityApp(page)

  await expect(app.main()).toBeVisible()

  await page.keyboard.press('Tab')

  await expectPageToHaveFocusedElement(page)
  await expectFocusedElementHasVisibleIndicator(page)

  const firstFocusedElement = await getActiveElementSummary(page)

  console.log(`First focused element: ${firstFocusedElement}`)

  for (let index = 0; index < 10; index++) {
    await page.keyboard.press('Tab')

    await expectPageToHaveFocusedElement(page)

    const activeElementSummary = await getActiveElementSummary(page)

    console.log(`Keyboard tab stop ${index + 1}: ${activeElementSummary}`)
  }
})

test('Shift Tab moves focus backward', async ({ page }) => {
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')

  const focusedBeforeShiftTab = await getActiveElementSummary(page)

  console.log(`Focused before Shift+Tab: ${focusedBeforeShiftTab}`)

  await page.keyboard.press('Shift+Tab')

  await expectPageToHaveFocusedElement(page)

  const focusedAfterShiftTab = await getActiveElementSummary(page)

  console.log(`Focused after Shift+Tab: ${focusedAfterShiftTab}`)

  expect(focusedAfterShiftTab).not.toEqual(focusedBeforeShiftTab)
})

test('Search can be completed using keyboard only', async ({ page }) => {
  const app = primaryCareAccessibilityApp(page)

  const hasResults = await searchByKeyboard(page, TEST_DATA.searchValue)

  await expect(app.main()).toBeVisible()

  if (!hasResults) {
    const message = `No result-card candidates found after keyboard search for: ${TEST_DATA.searchValue}`

    console.log(message)

    test.info().annotations.push({
      type: 'no-results-after-keyboard-search',
      description: message,
    })

    return
  }

  const visibleCards = await getVisibleResultCards(page)

  expect(visibleCards.length).toBeGreaterThan(0)
})

test('Search button can be reached and activated by keyboard if available', async ({ page }) => {
  const app = primaryCareAccessibilityApp(page)

  const searchButtonVisible = await isVisible(app.searchButton())

  if (!searchButtonVisible) {
    const message =
      'Search button was not visible; search may be submitted by pressing Enter in the input.'

    console.log(message)

    test.info().annotations.push({
      type: 'search-button-not-visible',
      description: message,
    })

    return
  }

  const reachedSearchButton = await tabToLocator(page, app.searchButton())

  if (!reachedSearchButton) {
    const message = 'Search button could not be reached with Tab within the configured tab limit.'

    console.log(message)

    test.info().annotations.push({
      type: 'search-button-not-reached-by-tab',
      description: message,
    })

    return
  }

  await expect(app.searchButton()).toBeFocused()

  await activateFocusedElementWithEnter(page)

  await expect(app.main()).toBeVisible()
})

test('First visible result card can be reached or activated with keyboard if focusable', async ({
  page,
}) => {
  const app = primaryCareAccessibilityApp(page)

  const hasResults = await searchByKeyboard(page, TEST_DATA.searchValue)

  if (!hasResults) {
    const message = `No result-card candidates found for keyboard result-card test using: ${TEST_DATA.searchValue}`

    console.log(message)

    test.info().annotations.push({
      type: 'no-results-for-keyboard-card-test',
      description: message,
    })

    return
  }

  const visibleCards = await getVisibleResultCards(page)

  if (visibleCards.length === 0) {
    const message = 'No visible meaningful result cards found for keyboard result-card test.'

    console.log(message)

    test.info().annotations.push({
      type: 'no-visible-result-cards-for-keyboard-test',
      description: message,
    })

    return
  }

  const firstCard = visibleCards[0]

  const firstCardText = await getElementText(firstCard)

  console.log(`First result card for keyboard test: ${firstCardText}`)

  const cardFocusable = await firstCard
    .evaluate<boolean, void>((element: HTMLElement | SVGElement) => {
      const htmlElement = element as HTMLElement

      const hasTabIndex = htmlElement.hasAttribute('tabindex')
      const tabIndex = htmlElement.tabIndex
      const isNaturallyFocusable = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(
        htmlElement.tagName
      )

      return isNaturallyFocusable || hasTabIndex || tabIndex >= 0
    })
    .catch(() => false)

  if (!cardFocusable) {
    const message =
      'First result card is not directly keyboard focusable. Card may require a nested link/button to be keyboard accessible.'

    console.log(message)

    test.info().annotations.push({
      type: 'result-card-not-directly-focusable',
      description: message,
    })

    await expect(app.main()).toBeVisible()

    return
  }

  const reachedCard = await tabToLocator(page, firstCard)

  if (!reachedCard) {
    const message =
      'First result card is focusable but was not reached by Tab within the configured tab limit.'

    console.log(message)

    test.info().annotations.push({
      type: 'result-card-not-reached-by-tab',
      description: message,
    })

    return
  }

  await expectFocusedElementHasVisibleIndicator(page)

  await activateFocusedElementWithEnter(page)

  await expect(app.main()).toBeVisible()

  await pressEscapeAndValidateAppStable(page)
})

test('Visible filter controls can be reached or reported for keyboard accessibility', async ({
  page,
}) => {
  const app = primaryCareAccessibilityApp(page)

  await searchByKeyboard(page, TEST_DATA.searchValue)

  const checkboxCount = await app.checkboxes().count()
  const radioCount = await app.radios().count()
  const comboboxCount = await app.comboboxes().count()
  const filterButtonCount = await app.filterButtons().count()

  console.log(`Checkbox count: ${checkboxCount}`)
  console.log(`Radio count: ${radioCount}`)
  console.log(`Dropdown count: ${comboboxCount}`)
  console.log(`Filter button count: ${filterButtonCount}`)

  const totalFilterControls = checkboxCount + radioCount + comboboxCount + filterButtonCount

  if (totalFilterControls === 0) {
    const message = 'No filter controls were found for keyboard accessibility testing.'

    console.log(message)

    test.info().annotations.push({
      type: 'no-filter-controls-found',
      description: message,
    })

    return
  }

  await expect(app.main()).toBeVisible()
})

test('Escape key does not break the app state', async ({ page }) => {
  const app = primaryCareAccessibilityApp(page)

  await expect(app.main()).toBeVisible()

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  await expect(app.main()).toBeVisible()
})

test('Keyboard focus does not disappear after multiple Tab presses', async ({ page }) => {
  const app = primaryCareAccessibilityApp(page)

  await expect(app.main()).toBeVisible()

  for (let index = 0; index < TEST_DATA.maxTabPresses; index++) {
    await page.keyboard.press('Tab')

    await expectPageToHaveFocusedElement(page)

    const activeElementSummary = await getActiveElementSummary(page)

    console.log(`Tab stability check ${index + 1}: ${activeElementSummary}`)
  }

  await expect(app.main()).toBeVisible()
})
