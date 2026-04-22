import { test, expect, Page, Locator } from '@playwright/test';

const BASE_URL = 'https://gruppenplatz.healthycloud.de/HC_GP_Public_Pages/';

/**
 * NAVIGATION
 */
async function navigateToHome(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');
}

/**
 * SEARCH
 */
async function getSearchInput(page: Page): Promise<Locator> {
  const input = page.locator('input[type="text"]').first();
  await expect(input).toBeVisible();
  return input;
}

async function performSearch(page: Page, city: string) {
  const input = await getSearchInput(page);
  await input.fill(city);
  await input.press('Enter');
}

/**
 * RESULTS
 */
function getResultItems(page: Page): Locator {
  return page.locator('[class*="result"], [data-test="result-item"]');
}

async function waitForResults(page: Page) {
  await page.waitForLoadState('networkidle');
  await getResultItems(page).first().waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * VALIDATION: Count results
 */
async function validateResultCount(page: Page, minExpected: number = 1) {
  const results = getResultItems(page);
  const count = await results.count();
  expect(count).toBeGreaterThanOrEqual(minExpected);
}

/**
 * VALIDATION: Each result has meaningful content
 */
async function validateResultContent(page: Page) {
  const results = getResultItems(page);
  const count = await results.count();

  for (let i = 0; i < count; i++) {
    const item = results.nth(i);

    // Extract visible text
    const text = await item.innerText();

    // Basic validation: not empty and has reasonable length
    expect(text.trim().length).toBeGreaterThan(10);

    // Optional: check for expected keywords (like city)
    // expect(text).toMatch(/Berlin|Hamburg|München/i);
  }
}

/**
 * VALIDATION: Extract specific fields (if structure allows)
 */
async function validateStructuredFields(page: Page) {
  const results = getResultItems(page);
  const firstItem = results.first();

  // Example: try to find name/title inside result
  const title = firstItem.locator('h1, h2, h3, strong').first();

  if (await title.isVisible()) {
    const titleText = await title.innerText();
    expect(titleText.trim().length).toBeGreaterThan(3);
  }
}

/**
 * VALIDATION: Ensure results change after new search
 */
async function getFirstResultText(page: Page): Promise<string> {
  const first = getResultItems(page).first();
  return await first.innerText();
}

/**
 * TESTS
 */

test.describe('Search + Listing Validation', () => {

  test('Search returns valid list entries', async ({ page }) => {
    await navigateToHome(page);
    await performSearch(page, 'Berlin');
    await waitForResults(page);

    await validateResultCount(page);
    await validateResultContent(page);
    await validateStructuredFields(page);
  });

  test('Search results update when changing city', async ({ page }) => {
    await navigateToHome(page);

    await performSearch(page, 'Berlin');
    await waitForResults(page);
    const firstBerlin = await getFirstResultText(page);

    await performSearch(page, 'Hamburg');
    await waitForResults(page);
    const firstHamburg = await getFirstResultText(page);

    expect(firstBerlin).not.toEqual(firstHamburg);
  });

  test('Search via URL shows listing', async ({ page }) => {
    await page.goto(`${BASE_URL}?City=Köln`);
    await waitForResults(page);

    await validateResultCount(page);
    await validateResultContent(page);
  });

});