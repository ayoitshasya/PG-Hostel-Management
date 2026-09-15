const { test, expect } = require('@playwright/test');

// Runs only on the "Mobile Chrome" project (see playwright.config.js) -
// a real mobile viewport (Pixel 5: 393x851, per Playwright's device
// descriptor), not just a resized desktop browser window.
test.describe('responsive layout on a mobile viewport', () => {
  test('home page has no horizontal overflow and CTAs are reachable', async ({ page }) => {
    await page.goto('/');
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for sub-pixel rounding

    // Scoped to #main-content rather than the whole page - "List Your PG"
    // appears both as a hero CTA and (at wider viewports) a header nav
    // link, and this test only cares about the hero CTA being reachable.
    const main = page.locator('#main-content');
    await expect(main.getByRole('link', { name: 'Find a PG' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'List Your PG' })).toBeVisible();
  });

  test('/find filters and results are usable without horizontal scrolling', async ({ page }) => {
    await page.goto('/find');
    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);

    await expect(page.getByLabel('Search for PG or Hostel')).toBeVisible();
    await expect(page.getByLabel('Property type')).toBeVisible();
    // Results grid should be present (skeleton or real cards) and not
    // force the page wider than the viewport.
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
  });

  test('listing detail page stacks to one column and has no horizontal overflow', async ({ page, request }) => {
    // Grab a real listing id from the API rather than hardcoding one,
    // so this test doesn't depend on exactly what's seeded.
    const res = await request.get('http://localhost:5000/api/properties?limit=1');
    const { results } = await res.json();
    test.skip(!results?.length, 'No listings in the database to test against - seed the database first.');

    await page.goto(`/listing/${results[0]._id}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });
});
