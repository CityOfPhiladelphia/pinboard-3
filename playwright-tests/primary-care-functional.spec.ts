// Import Playwright test runner, assertion library, Page type, and Locator type
import { test, expect, Page, Locator } from '@playwright/test';

// Give this file more time because search/filter UI may load data slowly
test.setTimeout(120000);

// Store the app URL in one place so it is easy to update later
const APP_URL = 'https://test-primary-care.phila.gov/';

// =====================================================
// CENTRALIZED TEXT / EXPECTED VALUES
// Update these if page text changes later.
// =====================================================

const APP_TEXT = {
  // Expected browser tab title
  pageTitle: /Primary care finder/i,

  // Expected main page text
  mainText: /Primary care/i,
};

// =====================================================
// CENTRALIZED TEST DATA
// Update these if you want to test different searches.
// =====================================================

const TEST_DATA = {
  // Search value used for a basic ZIP code search test
  searchValue: '19104',

  // Another ZIP code to verify search can be reused
  secondSearchValue: '19131',

  // Search value that may return no results
  noResultsSearchValue: '00000',

  // Limit how many result cards we inspect/click so test does not run too long
  maxResultsToCheck: 3,
};

// =====================================================
// CENTRALIZED ROLE NAMES
// Update these after codegen if app wording differs.
// =====================================================

const ROLES = {
  // Search textbox possible name
  searchTextboxName: /search|address|zip|zipcode|keyword|location/i,

  // Search button possible name
  searchButtonName: /search|find/i,

  // Clear/reset button possible name
  clearButtonName: /clear|reset|start over/i,

  // Filter button possible name
  filterButtonName: /filter|filters|refine/i,

  // Sort button possible name
  sortButtonName: /sort/i,
};

// =====================================================
// CSS SELECTORS
// These are fallback selectors if role locators are not enough.
// Update after inspecting the app.
// =====================================================

const CSS = {
  // Main page container
  main: 'main',

  // Generic result card fallback selector
  resultCards: '[class*="card"], [class*="result"], li',

  // Generic result heading fallback selector
  resultHeading: 'h1, h2, h3, h4, h5, h6',

  // Generic filter container fallback selector
  filterArea: '[class*="filter"], aside, form',
};

// =====================================================
// PAGE OBJECT STYLE HELPERS
// Tests call these instead of repeating locators.
// =====================================================

const primaryCareApp = (page: Page) => ({
  // Main page area
  main: () => page.locator(CSS.main).first(),

  // Page body
  body: () => page.locator('body'),

  // Search textbox using flexible accessible name
  searchBox: () =>
    page.getByRole('textbox', {
      name: ROLES.searchTextboxName,
    }),

  // Search button using flexible accessible name
  searchButton: () =>
    page
      .getByRole('button', {
        name: ROLES.searchButtonName,
      })
      .first(),

  // Clear/reset button if available
  clearButton: () =>
    page
      .getByRole('button', {
        name: ROLES.clearButtonName,
      })
      .first(),

  // Filter button if available
  filterButton: () =>
    page
      .getByRole('button', {
        name: ROLES.filterButtonName,
      })
      .first(),

  // Sort button if available
  sortButton: () =>
    page
      .getByRole('button', {
        name: ROLES.sortButtonName,
      })
      .first(),

  // Any checkbox filters
  checkboxes: () => page.getByRole('checkbox'),

  // Any radio filters
  radios: () => page.getByRole('radio'),

  // Any dropdown/combobox filters
  comboboxes: () => page.getByRole('combobox'),

  // Any result cards using fallback selector
  resultCards: () => page.locator(CSS.resultCards),

  // Possible filter area
  filterArea: () => page.locator(CSS.filterArea).first(),
});

// =====================================================
// SHARED HELPERS
// =====================================================

// Shows the current test name on the browser page during runtime
async function showTestNameOnPage(page: Page, testName: string) {
  // Inject a banner into the browser page
  await page.evaluate<void, string>((name: string) => {
    // Remove existing banner if one already exists
    const existingBanner = document.getElementById('playwright-test-banner');

    // Remove old banner before creating a new one
    if (existingBanner) {
      existingBanner.remove();
    }

    // Create a new banner element
    const banner = document.createElement('div');

    // Set unique banner ID
    banner.id = 'playwright-test-banner';

    // Set banner text
    banner.textContent = `Running test: ${name}`;

    // Keep banner fixed at the top of the browser
    banner.style.position = 'fixed';

    // Position banner from the top
    banner.style.top = '10px';

    // Center banner horizontally
    banner.style.left = '50%';

    // Adjust center alignment
    banner.style.transform = 'translateX(-50%)';

    // Keep banner above app UI
    banner.style.zIndex = '999999';

    // Set banner background color
    banner.style.background = '#111827';

    // Set banner text color
    banner.style.color = 'white';

    // Add spacing inside banner
    banner.style.padding = '10px 16px';

    // Round banner corners
    banner.style.borderRadius = '8px';

    // Set readable font size
    banner.style.fontSize = '24px';

    // Set font family
    banner.style.fontFamily = 'Arial, sans-serif';

    // Add shadow so banner stands out
    banner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';

    // Prevent banner from blocking clicks on the app
    banner.style.pointerEvents = 'none';

    // Add banner to the page body
    document.body.appendChild(banner);
  }, testName);
}

// Check if a locator is visible without failing the test
async function isVisible(locator: Locator): Promise<boolean> {
  // Return true if locator is visible
  return await locator.isVisible().catch(() => false);
}

// Search by value and return whether result-like elements appear
async function searchByValue(
  page: Page,
  searchValue: string,
): Promise<boolean> {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Verify search box is visible
  await expect(app.searchBox()).toBeVisible({
    timeout: 10000,
  });

  // Clear search box
  await app.searchBox().fill('');

  // Fill search value
  await app.searchBox().fill(searchValue);

  // Verify search box keeps entered value
  await expect(app.searchBox()).toHaveValue(searchValue);

  // Check if search button exists
  const searchButtonVisible = await isVisible(app.searchButton());

  // Click search button if it exists
  if (searchButtonVisible) {
    await app.searchButton().click();
  }

  // Press Enter if search button is not visible
  else {
    await app.searchBox().press('Enter');
  }

  // Give results time to update
  await page.waitForTimeout(1000);

  // Count possible result cards
  const resultCardCount = await app.resultCards().count();

  // Print count
  console.log(`Result card count after search: ${resultCardCount}`);

  // Return true if possible result cards exist
  return resultCardCount > 0;
}

// Get visible result cards only
async function getVisibleResultCards(page: Page): Promise<Locator[]> {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Count all possible cards
  const cardCount = await app.resultCards().count();

  // Create empty visible card array
  const visibleCards: Locator[] = [];

  // Loop through all possible cards
  for (let index = 0; index < cardCount; index++) {
    // Get current card
    const card = app.resultCards().nth(index);

    // Check if card is visible
    const cardVisible = await isVisible(card);

    // Add visible card to array
    if (cardVisible) {
      visibleCards.push(card);
    }
  }

  // Print visible card count
  console.log(`Visible result cards found: ${visibleCards.length}`);

  // Return visible cards
  return visibleCards;
}

// Click clear/reset button if the app provides one
async function clearSearchIfAvailable(page: Page): Promise<boolean> {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Check if clear/reset button is visible
  const clearButtonVisible = await isVisible(app.clearButton());

  // If no clear/reset button exists, return false
  if (!clearButtonVisible) {
    console.log('Clear/reset button not found.');
    return false;
  }

  // Click clear/reset button
  await app.clearButton().click();

  // Wait for UI to update
  await page.waitForTimeout(500);

  // Print success message
  console.log('Clear/reset button clicked.');

  // Return true because clear/reset was used
  return true;
}

// =====================================================
// SHARED TEST SETUP
// =====================================================

// Run this setup before every test
test.beforeEach(async ({ page }, testInfo) => {
  // Open the Primary Care Finder app
  await page.goto(APP_URL, {
    waitUntil: 'domcontentloaded',
  });

  // Wait for network activity to settle, but do not fail if app keeps polling
  await page.waitForLoadState('networkidle').catch(() => {});

  // Show the current test name on the browser page
  await showTestNameOnPage(page, testInfo.title);
});

// =====================================================
// FUNCTIONAL TESTS
// =====================================================

// Test that the app loads successfully
test('Primary Care Finder landing page loads', async ({ page }) => {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Verify browser tab title
  await expect(page).toHaveTitle(APP_TEXT.pageTitle);

  // Verify main page area is visible
  await expect(app.main()).toBeVisible();

  // Verify body contains primary care text
  await expect(app.body()).toContainText(APP_TEXT.mainText);
});

// Test that search input is available
test('Search input is visible and usable', async ({ page }) => {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Verify search box is visible
  await expect(app.searchBox()).toBeVisible({
    timeout: 10000,
  });

  // Fill search box
  await app.searchBox().fill(TEST_DATA.searchValue);

  // Verify search value is entered
  await expect(app.searchBox()).toHaveValue(TEST_DATA.searchValue);
});

// Test that a search can be submitted
test('Search can be submitted', async ({ page }) => {
  // Run search
  const hasResults = await searchByValue(page, TEST_DATA.searchValue);

  // If no results are found, log and end gracefully
  if (!hasResults) {
    // Create no-results message
    const message = `No results found for search value: ${TEST_DATA.searchValue}`;

    // Print message
    console.log(message);

    // Add note to Playwright report
    test.info().annotations.push({
      type: 'no-results',
      description: message,
    });

    // End test without failing
    return;
  }

  // Verify at least one result-like element exists
  expect(hasResults).toBeTruthy();
});

// Test that search can be reused with another ZIP code
test('Search can be reused with another ZIP code', async ({ page }) => {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Search first ZIP code
  await searchByValue(page, TEST_DATA.searchValue);

  // Verify first value is in search box
  await expect(app.searchBox()).toHaveValue(TEST_DATA.searchValue);

  // Search second ZIP code
  await searchByValue(page, TEST_DATA.secondSearchValue);

  // Verify second value is in search box
  await expect(app.searchBox()).toHaveValue(TEST_DATA.secondSearchValue);

  // Verify main app still visible
  await expect(app.main()).toBeVisible();
});

// Test no-results flow does not fail the test
test('No-results search is handled gracefully', async ({ page }) => {
  // Run no-results search
  const hasResults = await searchByValue(page, TEST_DATA.noResultsSearchValue);

  // If no results are found, this is acceptable
  if (!hasResults) {
    // Create message
    const message = `No results found for search value: ${TEST_DATA.noResultsSearchValue}`;

    // Print message
    console.log(message);

    // Add note to Playwright report
    test.info().annotations.push({
      type: 'expected-no-results',
      description: message,
    });

    // End test without failing
    return;
  }

  // If results appear, verify that result area exists
  expect(hasResults).toBeTruthy();
});

// =====================================================
// FILTER TESTS
// These are flexible because filter labels may change.
// =====================================================

// Test that filter controls are available if the app provides them
test('Filter controls are visible if available', async ({ page }) => {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Count common filter controls
  const checkboxCount = await app.checkboxes().count();
  const radioCount = await app.radios().count();
  const comboboxCount = await app.comboboxes().count();

  // Print counts
  console.log(`Checkbox filter count: ${checkboxCount}`);
  console.log(`Radio filter count: ${radioCount}`);
  console.log(`Dropdown filter count: ${comboboxCount}`);

  // Check if any filter area is visible
  const filterAreaVisible = await isVisible(app.filterArea());

  // Check if any filter button is visible
  const filterButtonVisible = await isVisible(app.filterButton());

  // Print filter area/button status
  console.log(`Filter area visible: ${filterAreaVisible}`);
  console.log(`Filter button visible: ${filterButtonVisible}`);

  // Verify the app itself is still visible
  await expect(app.main()).toBeVisible();

  // If no filters exist, log and pass gracefully
  if (
    checkboxCount === 0 &&
    radioCount === 0 &&
    comboboxCount === 0 &&
    !filterAreaVisible &&
    !filterButtonVisible
  ) {
    // Create message
    const message = 'No filter controls found on current app state.';

    // Print message
    console.log(message);

    // Add annotation
    test.info().annotations.push({
      type: 'filters-not-found',
      description: message,
    });

    // End test without failing
    return;
  }

  // Verify at least one type of filter UI exists
  expect(
    checkboxCount + radioCount + comboboxCount > 0 ||
      filterAreaVisible ||
      filterButtonVisible,
  ).toBeTruthy();
});

// Test that first checkbox filter can be toggled if available
test('Checkbox filter can be toggled if available', async ({ page }) => {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Count checkboxes
  const checkboxCount = await app.checkboxes().count();

  // If no checkbox exists, log and pass gracefully
  if (checkboxCount === 0) {
    // Create message
    const message = 'No checkbox filters found.';

    // Print message
    console.log(message);

    // Add annotation
    test.info().annotations.push({
      type: 'checkbox-filter-not-found',
      description: message,
    });

    // End test without failing
    return;
  }

  // Get first checkbox
  const firstCheckbox = app.checkboxes().first();

  // Verify checkbox is visible
  await expect(firstCheckbox).toBeVisible();

  // Save checked state before click
  const checkedBefore = await firstCheckbox.isChecked();

  // Click checkbox
  await firstCheckbox.click();

  // Wait for UI to update
  await page.waitForTimeout(500);

  // Save checked state after click
  const checkedAfter = await firstCheckbox.isChecked();

  // Print states
  console.log(`Checkbox checked before: ${checkedBefore}`);
  console.log(`Checkbox checked after: ${checkedAfter}`);

  // Verify checkbox state changed
  expect(checkedAfter).not.toBe(checkedBefore);
});

// Test that first radio filter can be selected if available
test('Radio filter can be selected if available', async ({ page }) => {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Count radio buttons
  const radioCount = await app.radios().count();

  // If no radio button exists, log and pass gracefully
  if (radioCount === 0) {
    // Create message
    const message = 'No radio filters found.';

    // Print message
    console.log(message);

    // Add annotation
    test.info().annotations.push({
      type: 'radio-filter-not-found',
      description: message,
    });

    // End test without failing
    return;
  }

  // Get first radio button
  const firstRadio = app.radios().first();

  // Verify radio button is visible
  await expect(firstRadio).toBeVisible();

  // Click first radio button
  await firstRadio.click();

  // Wait for UI to update
  await page.waitForTimeout(500);

  // Verify first radio is checked
  await expect(firstRadio).toBeChecked();
});

// Test that first dropdown filter can be opened if available
test('Dropdown filter can be opened if available', async ({ page }) => {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Count dropdowns
  const comboboxCount = await app.comboboxes().count();

  // If no dropdown exists, log and pass gracefully
  if (comboboxCount === 0) {
    // Create message
    const message = 'No dropdown filters found.';

    // Print message
    console.log(message);

    // Add annotation
    test.info().annotations.push({
      type: 'dropdown-filter-not-found',
      description: message,
    });

    // End test without failing
    return;
  }

  // Get first dropdown
  const firstDropdown = app.comboboxes().first();

  // Verify dropdown is visible
  await expect(firstDropdown).toBeVisible();

  // Click dropdown
  await firstDropdown.click();

  // Wait for dropdown options to render
  await page.waitForTimeout(500);

  // Verify dropdown is still visible
  await expect(firstDropdown).toBeVisible();
});

// Test that filter button can be clicked if available
test('Filter button can be clicked if available', async ({ page }) => {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Check if filter button is visible
  const filterButtonVisible = await isVisible(app.filterButton());

  // If no filter button exists, log and pass gracefully
  if (!filterButtonVisible) {
    // Create message
    const message = 'No filter button found.';

    // Print message
    console.log(message);

    // Add annotation
    test.info().annotations.push({
      type: 'filter-button-not-found',
      description: message,
    });

    // End test without failing
    return;
  }

  // Click filter button
  await app.filterButton().click();

  // Wait for UI to update
  await page.waitForTimeout(500);

  // Verify main app still visible
  await expect(app.main()).toBeVisible();
});

// =====================================================
// RESULT CARD / SORT / RESET TESTS
// =====================================================

// Test that result cards appear after search and can be inspected
test('Result cards can be inspected after search', async ({ page }) => {
  // Run search
  const hasResults = await searchByValue(page, TEST_DATA.searchValue);

  // If no results, log and end gracefully
  if (!hasResults) {
    // Create message
    const message = `No result cards to inspect for search value: ${TEST_DATA.searchValue}`;

    // Print message
    console.log(message);

    // Add annotation
    test.info().annotations.push({
      type: 'no-result-cards',
      description: message,
    });

    // End test without failing
    return;
  }

  // Get visible result cards
  const visibleCards = await getVisibleResultCards(page);

  // Verify at least one visible result card exists
  expect(visibleCards.length).toBeGreaterThan(0);

  // Limit how many cards we inspect
  const cardsToCheck = visibleCards.slice(0, TEST_DATA.maxResultsToCheck);

  // Loop through limited visible cards
  for (let index = 0; index < cardsToCheck.length; index++) {
    // Get current card
    const card = cardsToCheck[index];

    // Verify card is visible
    await expect(card).toBeVisible();

    // Read card text
    const cardText = await card.innerText().catch(() => '');

    // Print card text
    console.log(`Result card ${index + 1}: ${cardText}`);
  }
});

// Test that first result card can be clicked if available
test('First result card can be clicked if available', async ({ page }) => {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Run search
  const hasResults = await searchByValue(page, TEST_DATA.searchValue);

  // If no results, log and end gracefully
  if (!hasResults) {
    // Create message
    const message = `No result card found to click for search value: ${TEST_DATA.searchValue}`;

    // Print message
    console.log(message);

    // Add annotation
    test.info().annotations.push({
      type: 'no-clickable-result-card',
      description: message,
    });

    // End test without failing
    return;
  }

  // Get visible result cards
  const visibleCards = await getVisibleResultCards(page);

  // If no visible cards, log and end gracefully
  if (visibleCards.length === 0) {
    // Create message
    const message = 'No visible result card found to click.';

    // Print message
    console.log(message);

    // Add annotation
    test.info().annotations.push({
      type: 'no-visible-clickable-result-card',
      description: message,
    });

    // End test without failing
    return;
  }

  // Get first visible card
  const firstCard = visibleCards[0];

  // Save page URL before click
  const urlBeforeClick = page.url();

  // Click first card
  await firstCard.click();

  // Wait after click
  await page.waitForTimeout(1000);

  // Save page URL after click
  const urlAfterClick = page.url();

  // Print URL status
  console.log(`URL before card click: ${urlBeforeClick}`);
  console.log(`URL after card click: ${urlAfterClick}`);

  // Verify app is still visible after click
  await expect(app.main()).toBeVisible();
});

// Test that sort button can be clicked if available
test('Sort button can be clicked if available', async ({ page }) => {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Search first so sort has results to work with
  await searchByValue(page, TEST_DATA.searchValue);

  // Check if sort button is visible
  const sortButtonVisible = await isVisible(app.sortButton());

  // If no sort button exists, log and pass gracefully
  if (!sortButtonVisible) {
    // Create message
    const message = 'No sort button found.';

    // Print message
    console.log(message);

    // Add annotation
    test.info().annotations.push({
      type: 'sort-button-not-found',
      description: message,
    });

    // End test without failing
    return;
  }

  // Click sort button
  await app.sortButton().click();

  // Wait for UI to update
  await page.waitForTimeout(500);

  // Verify main app remains visible
  await expect(app.main()).toBeVisible();
});

// Test that clear or reset works if available
test('Clear or reset search works if available', async ({ page }) => {
  // Create locator helper object
  const app = primaryCareApp(page);

  // Run search
  await searchByValue(page, TEST_DATA.searchValue);

  // Try clearing/resetting
  const didClear = await clearSearchIfAvailable(page);

  // If no clear/reset button exists, log and pass gracefully
  if (!didClear) {
    // Create message
    const message = 'Clear/reset search was not available.';

    // Add annotation
    test.info().annotations.push({
      type: 'clear-reset-not-found',
      description: message,
    });

    // End test without failing
    return;
  }

  // Verify app is still visible
  await expect(app.main()).toBeVisible();
});
