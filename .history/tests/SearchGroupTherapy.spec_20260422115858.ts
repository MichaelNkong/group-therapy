import { test, expect, Page, Locator } from '@playwright/test';

const BASE_URL = 'https://gruppenplatz.healthycloud.de/HC_GP_Public_Pages/';

/**
 * NAVIGATION
 */
async function navigateToHome(page: Page) {
  await page.goto(BASE_URL);
}

async function browserContext(page: Page) {
    const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
    
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

async function selectOptionFromDropdown(page: Page, optionText: string) {
await page.getByRole('option', { name: optionText, exact: true }).click();
 
}

async function performSearch(page: Page, optionText: string) {
  await fillSearchInput(page, optionText);
  await selectOptionFromDropdown(page, optionText);
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
/**
 * RESULTS
 * return listing items as locators for further validation
 */
function getListingItems(page: Page): Locator {
  return page.locator('.map-list.list.list-group.display-flex.flex-direction-column.OSFillParent > div[data-container]');

}
async function scrollToItemOrItems(page: Page, position: number = 2) {
  await page.locator('.map-list.list.list-group.display-flex.flex-direction-column.OSFillParent > div[data-container]').nth(position).scrollIntoViewIfNeeded();
}


async function scrollToInputField(page: Page) {
    page.locator('button', { hasText: 'Gruppen suchen' }).scrollIntoViewIfNeeded();;
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
  return await items.nth(0).innerText();
}

/**
 * VALIDATION: Extract specific fields (if structure allows)
 */



/**
 * TESTS
 */

test.describe('Search + Listing Validation', () => {

  test('search returns valid list entries', async ({ page }) => {
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
      await performSearch(page, 'Berlin');
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
      await page.waitForTimeout(5000);
      const acceptBtn = await getAcceptAllBtn(page);
      if (acceptBtn) {
        await acceptBtn.click({ timeout: 2000 });
        console.log("clicked accept all")
      }
      const startSearchBtn = await getStartSearchBtn(page);
     await startSearchBtn.nth(0).click({ timeout: 3000 });
    
      await fillSearchInput(page, 'UnknownCity');
      const searchGroupBtn = await getSearchGroupBtn(page);
      await searchGroupBtn.click();
      await expectListingCount(page, 0);
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });


  test('Search results updates when changing city', async ({ page }) => {
    try {
      await navigateToHome(page);
      await page.waitForTimeout(5000);
       await page.waitForTimeout(5000);
      const acceptBtn = await getAcceptAllBtn(page);
      if (acceptBtn) {
        await acceptBtn.click({ timeout: 2000 });
        console.log("clicked accept all")
      }
      const startSearchBtn = await getStartSearchBtn(page);
     await startSearchBtn.nth(0).click({ timeout: 3000 });
      await performSearch(page, 'Berlin');
       await page.waitForTimeout(3000)
      const firstBerlin = await getFirstResultText(page);
      await scrollToInputField(page);
      await performSearch(page, 'Hamburg');
      const firstHamburg = await getFirstResultText(page);

      expect(firstBerlin).not.toEqual(firstHamburg);
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });

  test('search page displays default data within acceptable loading time', async ({ page }) => {
    try {
      await page.goto(`${BASE_URL}`);
      await navigateToHome(page);
      await page.waitForTimeout(5000);
      const acceptBtn = await getAcceptAllBtn(page);
      if (acceptBtn) {
        await acceptBtn.click({ timeout: 2000 });
        console.log("clicked accept all")
      }
      const startSearchBtn = await getStartSearchBtn(page);

      // Start measuring time just before clicking the start search button  to lead default data
      const beforeSearch = Date.now();
      await startSearchBtn.nth(0).click({ timeout: 3000 });
    

  //  wait for actual data items
      await page.waitForSelector('.map-list.list.list-group.display-flex.flex-direction-column.OSFillParent > div[data-container]', { state: 'visible', timeout: 5000 });

 
      // time after the search results have loaded
      const afterSearch = Date.now();
      const loadingTime = afterSearch - beforeSearch;
      console.log(`Search loading time: ${loadingTime} ms`);
      expect(loadingTime).toBeLessThan(3000); // Expect loading time to be less than 3 seconds
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  });

});

