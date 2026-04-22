import { test, expect, Page, Locator } from '@playwright/test';

const BASE_URL = 'https://gruppenplatz.healthycloud.de/HC_GP_Public_Pages/';

/**
 * NAVIGATION
 */
async function navigateToHome(page: Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle', { timeout: 15000 });
}


async function getSearchInput(page: Page): Promise<Locator> {
  const input = page.getByPlaceholder('Bitte Ort oder Postleitzahl eingeben...');
  return input;
}

async function getAcceptAllBtn(page: Page): Promise<Locator> {
  const input = page.getByRole('button', { name: 'Accept All' });
  return input;
}

async function getStartSearchBtn(page: Page): Promise<Locator> {
  const input = page.locator('button', { hasText: 'Suche starten' });
  return input;
}

async function getSearchGroupBtn(page: Page): Promise<Locator> {
  const input = page.locator('button', { hasText: 'Gruppen suchen' });
  return input;
}


/**
 * SEARCH
 */
async function fillSearchInput(page: Page, cityOrZip: string) {
  const input = await getSearchInput(page);
  await input.fill(cityOrZip);
  //await input.press('Enter');
}
async function getListingCount(page: Page): Promise<number> {
  const items = getListingItems(page);
  console.log(`Listing count: ${await items.count()}`);
  return await items.count();
}

async function expectListingCount(page: Page, minCount: number) {
  const count = await getListingCount(page);
  expect(count).toEqual(minCount);
}
/**map-list-wrapper OSInline
 * RESULTS
 */
function getListingItems(page: Page): Locator {
  return page.locator('.map-list.list.list-group.display-flex.flex-direction-column.OSFillParent > div[data-container]');

}
async function scrollToItemOrItems(page: Page, position: number = 2) {
  await page.locator('.map-list.list.list-group.display-flex.flex-direction-column.OSFillParent > div[data-container]').nth(position).scrollIntoViewIfNeeded();
}
/**
 * VALIDATION: Count results
 */


/**
 * VALIDATION: Each result has meaningful content
 */async function expectItemsContainCity(page: Page, city: string) {
  const items = getListingItems(page);
  const count = await items.count();


  for (let i = 0; i < count; i++) {
    const text = await items.nth(i).innerText();
    console.log(`Item ${i + 1} text: ${text}`);

    expect(
      text.toLowerCase(),
      `Item ${i + 1} does not contain city "${city}". Actual text: ${text}`
    ).toContain(city.toLowerCase());
  }
}


async function waitForResults(page: Page, timeout: number = 1000) {
  await page.waitForSelector('.map-list.list.list-group.display-flex.flex-direction-column.OSFillParent > div[data-container]', { timeout });
}

async function getFirstResultText(page: Page): Promise<string> {
  const items = getListingItems(page);
  return await items.first().innerText();
}

/**
 * VALIDATION: Extract specific fields (if structure allows)
 */



/**
 * TESTS
 */

test.describe('Search + Listing Validation', () => {

  test.only('search returns valid list entries', async ({ page }) => {
    try {
      await navigateToHome(page);
      await page.waitForTimeout(5000);
      const acceptBtn = await getAcceptAllBtn(page);
      if (acceptBtn) {
        await acceptBtn.click({ timeout: 2000 });
        console.log("clicked accept all")
      }
      const startSearchBtn = await getStartSearchBtn(page);
      if (startSearchBtn) {
        await startSearchBtn.nth(0).click({ timeout: 3000 });
      }
      await fillSearchInput(page, 'Berlin');
      const searchGroupBtn = await getSearchGroupBtn(page);
      await searchGroupBtn.click({ timeout: 3000 });
      await scrollToItemOrItems(page,1);
      await page.waitForTimeout(5000);
      await expectListingCount(page, 4);

      await expectItemsContainCity(page, 'Berlin');
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });

  test('unknown city or zip code returns no listing', async ({ page }) => {
    try {
      await navigateToHome(page);
      await fillSearchInput(page, 'UnknownCity');
      await expectListingCount(page, 0);
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });


  test('Search results updates when changing city', async ({ page }) => {
    try {
      await navigateToHome(page);
      await page.waitForTimeout(1000);
      await fillSearchInput(page, 'Berlin');
      await waitForResults(page);
      const firstBerlin = await getFirstResultText(page);

      await fillSearchInput(page, 'Hamburg');
      await waitForResults(page);
      const firstHamburg = await getFirstResultText(page);

      expect(firstBerlin).not.toEqual(firstHamburg);
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });

  test('search page displays data within acceptable loading time', async ({ page }) => {
    try {
      await page.goto(`${BASE_URL}`);
      await waitForResults(page, 3000); // Wait up to 3 seconds for results to load
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });

});

