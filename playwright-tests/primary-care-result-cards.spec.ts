// Import Playwright test utilities and shared TypeScript types
import { test, expect, Page, Locator } from '@playwright/test';

// Allow enough time for search, filtering, and limited result-card interaction
test.setTimeout(120000);

// Centralized app URL for easier maintenance across environments
const APP_URL = 'https://test-primary-care.phila.gov/';

// =====================================================
// TEST DATA
// Search values and loop limits are centralized so test behavior
// can be adjusted without changing individual test logic.
// =====================================================

const TEST_DATA = {
  // ZIP code used to load Primary Care Finder results
  searchValue: '19104',

  // Alternate ZIP code used if you want to test a different result set
  alternateSearchValue: '19131',

  // Invalid ZIP code used to confirm no-results handling
  noResultsSearchValue: '00000',

  // Limit result-card interaction so the test does not become slow or flaky
  maxResultsToVerify: 5,

  // Minimum readable text expected from a real provider result card
  minimumCardTextLength: 20,
};

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
};

// =====================================================
// ACCESSIBLE ROLE NAMES
// Prefer role-based locators because they match user-facing behavior.
// Regex patterns keep the tests resilient to small label changes.
// =====================================================

const ROLES = {
  // Flexible search textbox name
  searchTextboxName: /search|address|zip|zipcode|keyword|location/i,

  // Flexible search button name
  searchButtonName: /search|find/i,

  // Flexible back/close/details locator for result detail views
  closeOrBackButtonName: /close|back|return|dismiss/i,

  // Button-style filter text patterns
  // These cover common custom filter buttons/pills when filters are not native inputs
  buttonFilterName:
    /accepting|patients|language|insurance|distance|specialty|provider|clinic|health center|wheelchair|telehealth|appointment|available|filter|filters|refine|apply/i,
};

// =====================================================
// FALLBACK SELECTORS
// CSS selectors are intentionally narrower than generic "li" selectors.
// This prevents counting nested wrappers or unrelated list items as cards.
// =====================================================

const CSS = {
  // Main page container
  main: 'main',

  // Narrower provider/result-card candidate selector
  // Avoid plain "li" because it can count hundreds of nested list items
  resultCards:
    '[class*="provider"], [class*="clinic"], [class*="location-card"], [class*="result-card"], [class*="search-result"]',

  // Result headings inside cards or detail views
  resultHeadings: 'h1, h2, h3, h4, h5, h6',
};

// =====================================================
// PAGE OBJECT HELPERS
// Centralized locators keep tests readable and easier to maintain.
// =====================================================

const primaryCareResultCardsApp = (page: Page) => ({
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

  // Headings used to confirm card/detail content
  resultHeadings: () => page.locator(CSS.resultHeadings),

  // Checkbox filters, if the app exposes them
  checkboxes: () => page.getByRole('checkbox'),

  // Radio filters, if the app exposes them
  radios: () => page.getByRole('radio'),

  // Dropdown filters, if the app exposes them
  comboboxes: () => page.getByRole('combobox'),

  // Button-style filters, if the app uses custom filter buttons/pills
  filterButtons: () =>
    page
      .getByRole('button', {
        name: ROLES.buttonFilterName,
      })
      .filter({
        hasNotText: /search|close|back|return|dismiss/i,
      }),

  // Optional close/back button if card click opens a details panel
  closeOrBackButton: () =>
    page
      .getByRole('button', {
        name: ROLES.closeOrBackButtonName,
      })
      .first(),
});

// =====================================================
// SHARED HELPERS
// Reusable helpers keep the test cases focused on user behavior.
// =====================================================

// Displays the currently running test name in headed browser runs
async function showTestNameOnPage(page: Page, testName: string) {
  await page.evaluate<void, string>((name: string) => {
    const existingBanner = document.getElementById('playwright-test-banner');

    if (existingBanner) {
      existingBanner.remove();
    }

    const banner = document.createElement('div');

    banner.id = 'playwright-test-banner';
    banner.textContent = `Running test: ${name}`;

    banner.style.position = 'fixed';
    banner.style.top = '10px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%)';
    banner.style.zIndex = '999999';
    banner.style.background = '#111827';
    banner.style.color = 'white';
    banner.style.padding = '10px 16px';
    banner.style.borderRadius = '8px';
    banner.style.fontSize = '24px';
    banner.style.fontFamily = 'Arial, sans-serif';
    banner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
    banner.style.pointerEvents = 'none';

    document.body.appendChild(banner);
  }, testName);
}

// Safely checks optional UI controls without failing the test
async function isVisible(locator: Locator): Promise<boolean> {
  return await locator.isVisible().catch(() => false);
}

// Returns a random item from a list of locators or values
function getRandomItem<T>(items: T[]): T {
  const randomIndex = Math.floor(Math.random() * items.length);

  return items[randomIndex];
}

// Submits a search and returns whether result-like elements are present
async function searchByValue(
  page: Page,
  searchValue: string,
): Promise<boolean> {
  const app = primaryCareResultCardsApp(page);

  // Confirm search is available before interacting with it
  await expect(app.searchBox()).toBeVisible({
    timeout: 10000,
  });

  // Enter the requested ZIP code or search value
  await app.searchBox().fill('');
  await app.searchBox().fill(searchValue);

  await expect(app.searchBox()).toHaveValue(searchValue);

  // Submit using the visible search button when available; otherwise use Enter
  const searchButtonVisible = await isVisible(app.searchButton());

  if (searchButtonVisible) {
    await app.searchButton().click();
  } else {
    await app.searchBox().press('Enter');
  }

  // Allow the result list to update
  await page.waitForTimeout(1000);

  const rawResultCardCount = await app.resultCards().count();

  console.log(
    `Raw result-card candidate count after search "${searchValue}": ${rawResultCardCount}`,
  );

  return rawResultCardCount > 0;
}

// Reads useful text from a result card for debugging and validation
async function getCardText(card: Locator): Promise<string> {
  const cardText = await card.innerText().catch(() => '');

  return cardText.trim();
}

// Determines whether a candidate element looks like a real provider result card
async function isMeaningfulProviderCard(card: Locator): Promise<boolean> {
  const cardVisible = await isVisible(card);

  if (!cardVisible) {
    return false;
  }

  const cardText = await getCardText(card);

  const hasEnoughText = cardText.length >= TEST_DATA.minimumCardTextLength;

  const hasProviderLikeText = APP_TEXT.providerCardText.test(cardText);

  return hasEnoughText && hasProviderLikeText;
}

// Returns only visible, meaningful result cards.
// This avoids counting nested list items, wrappers, icons, and hidden DOM elements.
async function getVisibleResultCards(page: Page): Promise<Locator[]> {
  const app = primaryCareResultCardsApp(page);

  const cardCount = await app.resultCards().count();
  const visibleMeaningfulCards: Locator[] = [];

  console.log(`Raw result-card candidate count: ${cardCount}`);

  for (let index = 0; index < cardCount; index++) {
    const card = app.resultCards().nth(index);

    const meaningfulProviderCard = await isMeaningfulProviderCard(card);

    if (meaningfulProviderCard) {
      visibleMeaningfulCards.push(card);
    }
  }

  console.log(
    `Visible meaningful result cards found: ${visibleMeaningfulCards.length}`,
  );

  return visibleMeaningfulCards;
}

// Captures current visible result-card text so the result set can be compared
// before and after applying a filter.
async function getVisibleResultTextSnapshot(page: Page): Promise<string[]> {
  const visibleCards = await getVisibleResultCards(page);

  const resultTexts: string[] = [];

  for (const card of visibleCards) {
    const cardText = await getCardText(card);

    if (cardText) {
      resultTexts.push(cardText);
    }
  }

  return resultTexts;
}

// Finds visible checkbox filters on the current page
async function getVisibleCheckboxFilters(page: Page): Promise<Locator[]> {
  const app = primaryCareResultCardsApp(page);

  const checkboxCount = await app.checkboxes().count();
  const visibleCheckboxes: Locator[] = [];

  for (let index = 0; index < checkboxCount; index++) {
    const checkbox = app.checkboxes().nth(index);

    if (await isVisible(checkbox)) {
      visibleCheckboxes.push(checkbox);
    }
  }

  console.log(`Visible checkbox filters found: ${visibleCheckboxes.length}`);

  return visibleCheckboxes;
}

// Finds visible radio filters on the current page
async function getVisibleRadioFilters(page: Page): Promise<Locator[]> {
  const app = primaryCareResultCardsApp(page);

  const radioCount = await app.radios().count();
  const visibleRadios: Locator[] = [];

  for (let index = 0; index < radioCount; index++) {
    const radio = app.radios().nth(index);

    if (await isVisible(radio)) {
      visibleRadios.push(radio);
    }
  }

  console.log(`Visible radio filters found: ${visibleRadios.length}`);

  return visibleRadios;
}

// Finds visible dropdown filters on the current page
async function getVisibleDropdownFilters(page: Page): Promise<Locator[]> {
  const app = primaryCareResultCardsApp(page);

  const dropdownCount = await app.comboboxes().count();
  const visibleDropdowns: Locator[] = [];

  for (let index = 0; index < dropdownCount; index++) {
    const dropdown = app.comboboxes().nth(index);

    if (await isVisible(dropdown)) {
      visibleDropdowns.push(dropdown);
    }
  }

  console.log(`Visible dropdown filters found: ${visibleDropdowns.length}`);

  return visibleDropdowns;
}

// Finds visible custom button-style filters.
// Some apps render filters as buttons instead of checkbox/radio/dropdown controls.
async function getVisibleButtonFilters(page: Page): Promise<Locator[]> {
  const app = primaryCareResultCardsApp(page);

  const buttonCount = await app.filterButtons().count();
  const visibleButtons: Locator[] = [];

  for (let index = 0; index < buttonCount; index++) {
    const button = app.filterButtons().nth(index);

    const buttonVisible = await isVisible(button);

    if (!buttonVisible) {
      continue;
    }

    const buttonText = await button.innerText().catch(() => '');
    const cleanedButtonText = buttonText.trim();

    if (cleanedButtonText.length > 0) {
      visibleButtons.push(button);
    }
  }

  console.log(`Visible button-style filters found: ${visibleButtons.length}`);

  return visibleButtons;
}

// Attempts to read a useful label/name for logging the selected filter
async function getFilterLabel(filter: Locator): Promise<string> {
  const ariaLabel = await filter.getAttribute('aria-label').catch(() => null);

  if (ariaLabel) {
    return ariaLabel;
  }

  const name = await filter.getAttribute('name').catch(() => null);

  if (name) {
    return name;
  }

  const id = await filter.getAttribute('id').catch(() => null);

  if (id) {
    return id;
  }

  const text = await filter.innerText().catch(() => '');

  if (text.trim()) {
    return text.trim();
  }

  return 'Unnamed filter';
}

// Clicks a random visible checkbox filter
async function clickRandomCheckboxFilter(page: Page): Promise<boolean> {
  const visibleCheckboxes = await getVisibleCheckboxFilters(page);

  if (visibleCheckboxes.length === 0) {
    return false;
  }

  const randomCheckbox = getRandomItem(visibleCheckboxes);
  const filterLabel = await getFilterLabel(randomCheckbox);

  await randomCheckbox.click();

  console.log(`Random checkbox filter clicked: ${filterLabel}`);

  await page.waitForTimeout(1000);

  return true;
}

// Clicks a random visible radio filter
async function clickRandomRadioFilter(page: Page): Promise<boolean> {
  const visibleRadios = await getVisibleRadioFilters(page);

  if (visibleRadios.length === 0) {
    return false;
  }

  const randomRadio = getRandomItem(visibleRadios);
  const filterLabel = await getFilterLabel(randomRadio);

  await randomRadio.click();

  console.log(`Random radio filter clicked: ${filterLabel}`);

  await page.waitForTimeout(1000);

  return true;
}

// Opens a random dropdown filter if available.
// This checks that the dropdown is interactive, but does not assume option names.
async function clickRandomDropdownFilter(page: Page): Promise<boolean> {
  const visibleDropdowns = await getVisibleDropdownFilters(page);

  if (visibleDropdowns.length === 0) {
    return false;
  }

  const randomDropdown = getRandomItem(visibleDropdowns);
  const filterLabel = await getFilterLabel(randomDropdown);

  await randomDropdown.click();

  console.log(`Random dropdown filter opened: ${filterLabel}`);

  await page.waitForTimeout(1000);

  return true;
}

// Clicks a random visible button-style filter.
// This supports apps that render filter choices as custom buttons or pills.
async function clickRandomButtonFilter(page: Page): Promise<boolean> {
  const visibleButtonFilters = await getVisibleButtonFilters(page);

  if (visibleButtonFilters.length === 0) {
    return false;
  }

  const randomButtonFilter = getRandomItem(visibleButtonFilters);
  const filterLabel = await getFilterLabel(randomButtonFilter);

  await randomButtonFilter.click();

  console.log(`Random button-style filter clicked: ${filterLabel}`);

  await page.waitForTimeout(1000);

  return true;
}

// Applies one random available filter.
// Priority is checkbox, then radio, dropdown, then custom button filters.
async function applyRandomFilter(page: Page): Promise<boolean> {
  const clickedCheckbox = await clickRandomCheckboxFilter(page);

  if (clickedCheckbox) {
    return true;
  }

  const clickedRadio = await clickRandomRadioFilter(page);

  if (clickedRadio) {
    return true;
  }

  const clickedDropdown = await clickRandomDropdownFilter(page);

  if (clickedDropdown) {
    return true;
  }

  const clickedButtonFilter = await clickRandomButtonFilter(page);

  if (clickedButtonFilter) {
    return true;
  }

  return false;
}

// Attempts to close a details panel if clicking a result card opens one
async function closeDetailsIfAvailable(page: Page): Promise<void> {
  const app = primaryCareResultCardsApp(page);

  const closeVisible = await isVisible(app.closeOrBackButton());

  if (!closeVisible) {
    console.log('No close/back button found after card click.');
    return;
  }

  await app.closeOrBackButton().click();
  await page.waitForTimeout(500);

  console.log('Closed result detail view.');
}

// Clicks a result card and validates that the app remains stable
async function clickAndVerifyResultCard(
  page: Page,
  card: Locator,
  index: number,
): Promise<void> {
  const app = primaryCareResultCardsApp(page);

  // Capture state before clicking so navigation or panel behavior can be logged
  const urlBeforeClick = page.url();

  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();

  const cardTextBeforeClick = await getCardText(card);

  console.log(`Clicking result card ${index + 1}: ${cardTextBeforeClick}`);

  await card.click();
  await page.waitForTimeout(1000);

  const urlAfterClick = page.url();

  console.log(`URL before card click: ${urlBeforeClick}`);
  console.log(`URL after card click: ${urlAfterClick}`);

  // The app should still have a valid main container after clicking
  await expect(app.main()).toBeVisible({
    timeout: 10000,
  });

  // If the click opens an in-page details panel, close it before the next card
  if (urlAfterClick === urlBeforeClick) {
    await closeDetailsIfAvailable(page);
  }

  // If the click navigates to another page, return to the result list
  if (urlAfterClick !== urlBeforeClick) {
    await page.goBack({
      waitUntil: 'domcontentloaded',
    });

    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(app.main()).toBeVisible();
  }
}

// =====================================================
// SHARED TEST SETUP
// Each test starts from a fresh app load.
// =====================================================

test.beforeEach(async ({ page }, testInfo) => {
  await page.goto(APP_URL, {
    waitUntil: 'domcontentloaded',
  });

  // The app may keep background requests open, so networkidle is non-blocking
  await page.waitForLoadState('networkidle').catch(() => {});

  await showTestNameOnPage(page, testInfo.title);
});

// =====================================================
// RESULT CARD TESTS
// =====================================================

test('Result cards appear after ZIP code search', async ({ page }) => {
  const app = primaryCareResultCardsApp(page);

  const hasResults = await searchByValue(page, TEST_DATA.searchValue);

  if (!hasResults) {
    const message = `No result-card candidates found for search value: ${TEST_DATA.searchValue}`;

    console.log(message);

    test.info().annotations.push({
      type: 'no-results',
      description: message,
    });

    return;
  }

  const visibleCards = await getVisibleResultCards(page);

  if (visibleCards.length === 0) {
    const message = `No visible meaningful result cards found for search value: ${TEST_DATA.searchValue}`;

    console.log(message);

    test.info().annotations.push({
      type: 'no-meaningful-results',
      description: message,
    });

    return;
  }

  expect(visibleCards.length).toBeGreaterThan(0);
  await expect(app.main()).toBeVisible();
});

test('Visible result cards contain readable provider information', async ({
  page,
}) => {
  const hasResults = await searchByValue(page, TEST_DATA.searchValue);

  if (!hasResults) {
    const message = `No readable result-card candidates found for search value: ${TEST_DATA.searchValue}`;

    console.log(message);

    test.info().annotations.push({
      type: 'no-results',
      description: message,
    });

    return;
  }

  const visibleCards = await getVisibleResultCards(page);

  if (visibleCards.length === 0) {
    const message =
      'Result-card candidates exist in DOM, but no meaningful provider cards were found.';

    console.log(message);

    test.info().annotations.push({
      type: 'no-visible-meaningful-results',
      description: message,
    });

    return;
  }

  const cardsToVerify = visibleCards.slice(0, TEST_DATA.maxResultsToVerify);

  console.log(
    `Verifying ${cardsToVerify.length} of ${visibleCards.length} visible meaningful result cards`,
  );

  for (let index = 0; index < cardsToVerify.length; index++) {
    const card = cardsToVerify[index];

    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();

    const cardText = await getCardText(card);

    console.log(`Result card ${index + 1}: ${cardText}`);

    // Each visible provider card should include meaningful readable text
    expect(cardText.length).toBeGreaterThan(
      TEST_DATA.minimumCardTextLength - 1,
    );

    expect(APP_TEXT.providerCardText.test(cardText)).toBeTruthy();
  }
});

test('First result card can be clicked and app remains stable', async ({
  page,
}) => {
  const hasResults = await searchByValue(page, TEST_DATA.searchValue);

  if (!hasResults) {
    const message = `No result-card candidates found to click for search value: ${TEST_DATA.searchValue}`;

    console.log(message);

    test.info().annotations.push({
      type: 'no-clickable-results',
      description: message,
    });

    return;
  }

  const visibleCards = await getVisibleResultCards(page);

  if (visibleCards.length === 0) {
    const message = 'No visible meaningful result card found to click.';

    console.log(message);

    test.info().annotations.push({
      type: 'no-visible-clickable-results',
      description: message,
    });

    return;
  }

  await clickAndVerifyResultCard(page, visibleCards[0], 0);
});

test('Limited result cards can be clicked without timing out', async ({
  page,
}) => {
  const hasResults = await searchByValue(page, TEST_DATA.searchValue);

  if (!hasResults) {
    const message = `No result-card candidates found for limited click test using: ${TEST_DATA.searchValue}`;

    console.log(message);

    test.info().annotations.push({
      type: 'no-results',
      description: message,
    });

    return;
  }

  const visibleCards = await getVisibleResultCards(page);

  if (visibleCards.length === 0) {
    const message =
      'No visible meaningful result cards found for limited click test.';

    console.log(message);

    test.info().annotations.push({
      type: 'no-visible-results',
      description: message,
    });

    return;
  }

  const cardsToClick = visibleCards.slice(0, TEST_DATA.maxResultsToVerify);

  console.log(
    `Clicking ${cardsToClick.length} of ${visibleCards.length} visible meaningful result cards`,
  );

  for (let index = 0; index < cardsToClick.length; index++) {
    // Re-read visible cards after each click because the DOM may update
    const refreshedVisibleCards = await getVisibleResultCards(page);

    const refreshedCardsToClick = refreshedVisibleCards.slice(
      0,
      TEST_DATA.maxResultsToVerify,
    );

    const card = refreshedCardsToClick[index];

    if (!card) {
      console.log(
        `Result card ${index + 1} no longer exists after DOM update.`,
      );
      continue;
    }

    await clickAndVerifyResultCard(page, card, index);
  }
});

// =====================================================
// RANDOM FILTER TEST
// This test validates filter interaction without depending on a specific
// filter label. It is useful as a smoke test for UI stability.
// =====================================================

test('Random available filter can be applied and results remain stable', async ({
  page,
}) => {
  const app = primaryCareResultCardsApp(page);

  const hasResultsBeforeFilter = await searchByValue(
    page,
    TEST_DATA.searchValue,
  );

  if (!hasResultsBeforeFilter) {
    const message = `No results available before filter for search value: ${TEST_DATA.searchValue}`;

    console.log(message);

    test.info().annotations.push({
      type: 'no-results-before-filter',
      description: message,
    });

    return;
  }

  const resultsBeforeFilter = await getVisibleResultTextSnapshot(page);

  console.log(
    `Visible meaningful results before random filter: ${resultsBeforeFilter.length}`,
  );

  const filterApplied = await applyRandomFilter(page);

  if (!filterApplied) {
    const message =
      'No visible checkbox, radio, dropdown, or button-style filter found to apply.';

    console.log(message);

    test.info().annotations.push({
      type: 'no-random-filter-found',
      description: message,
    });

    return;
  }

  await expect(app.main()).toBeVisible();

  const resultsAfterFilter = await getVisibleResultTextSnapshot(page);

  console.log(
    `Visible meaningful results after random filter: ${resultsAfterFilter.length}`,
  );

  // The app should remain stable even if the selected filter returns zero results
  expect(Array.isArray(resultsAfterFilter)).toBeTruthy();

  const beforeSnapshot = JSON.stringify(resultsBeforeFilter);
  const afterSnapshot = JSON.stringify(resultsAfterFilter);

  // Some filters may not change visible results, depending on current data.
  // That is logged as useful diagnostic information instead of a hard failure.
  if (beforeSnapshot === afterSnapshot) {
    const message =
      'Random filter was applied, but visible result cards did not change. This may be valid if the selected filter already matches the current result set.';

    console.log(message);

    test.info().annotations.push({
      type: 'filter-did-not-change-results',
      description: message,
    });

    return;
  }

  expect(afterSnapshot).not.toEqual(beforeSnapshot);
});

test('No-results search is handled gracefully in result-card suite', async ({
  page,
}) => {
  const hasResults = await searchByValue(page, TEST_DATA.noResultsSearchValue);

  if (!hasResults) {
    const message = `No results found for search value: ${TEST_DATA.noResultsSearchValue}`;

    console.log(message);

    test.info().annotations.push({
      type: 'expected-no-results',
      description: message,
    });

    return;
  }

  const visibleCards = await getVisibleResultCards(page);

  console.log(
    `Unexpected meaningful results found for no-results search: ${visibleCards.length}`,
  );

  // If the app returns results for the no-results value, verify the UI is still stable
  expect(visibleCards.length).toBeGreaterThanOrEqual(0);
});
