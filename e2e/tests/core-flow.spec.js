const { test, expect } = require('@playwright/test');
const { uniqueSuffix, signup } = require('./helpers');

// One continuous journey rather than isolated tests, because the steps
// are inherently dependent: the tenant needs a real listing (created by
// the renter step) to search for, open, and inquire about, and the last
// step needs that inquiry to exist to verify the tenant dashboard shows
// it. Splitting these into unrelated `test()` blocks would mean either
// re-deriving all this state per test (slower, more DB writes) or
// sharing state across tests (which Playwright doesn't guarantee
// ordering for). Using test.step() keeps one browser session/user
// throughout each phase while still reporting each phase separately.
test('renter creates a listing, tenant finds it, inquires, and sees it on their dashboard', async ({ page }) => {
  const suffix = uniqueSuffix();
  const listingTitle = `Playwright Test PG ${suffix}`;
  const renterEmail = `renter-${suffix}@example.com`;
  const tenantEmail = `tenant-${suffix}@example.com`;

  await test.step('renter signs up', async () => {
    await signup(page, { role: 'Renter', name: 'Test Renter', email: renterEmail });
  });

  await test.step('renter creates a listing', async () => {
    await page.goto('/create-listing');

    // Step 0: Basic
    await page.getByLabel('Property Name').fill(listingTitle);
    await page.getByLabel('Property Type').selectOption('PG');
    await page.getByLabel('Target Audience').selectOption('co-ed');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 1: Amenities - optional, just advance
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Rooms & Pricing - the default room needs a price
    await page.getByLabel(/Room 1 price per month/i).fill('9500');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 3: Photos - optional, just advance
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 4: Location & Contact
    await page.getByLabel('Address').fill('123 Test Street, Playwright City');
    await page.getByRole('button', { name: 'Create listing' }).click();

    // CreateListing shows a success message then navigates to /listing/:id
    await expect(page.getByText('Property created successfully.')).toBeVisible();
    await page.waitForURL(/\/listing\//, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: listingTitle, level: 1 })).toBeVisible();
  });

  await test.step('tenant signs up', async () => {
    await signup(page, { role: 'Tenant', name: 'Test Tenant', email: tenantEmail });
  });

  await test.step('tenant searches and filters on /find', async () => {
    await page.goto('/find');
    await page.getByLabel('Search for PG or Hostel').fill(listingTitle);
    // Scoped to the search <form> - the "search" tab button above it has
    // the same accessible name ("Search"), so an unscoped role query is
    // ambiguous even with exact: true.
    await page.locator('form').getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByRole('heading', { name: listingTitle })).toBeVisible({ timeout: 10000 });
  });

  await test.step('tenant opens the listing and sends an inquiry', async () => {
    await page.getByRole('heading', { name: listingTitle }).click();
    await page.waitForURL(/\/listing\//);
    await page.getByRole('button', { name: 'Send Inquiry' }).click();

    // Modal should be a focus-trapped dialog (Phase 4) - confirm it's
    // actually announced as one, not just visually a popup.
    const dialog = page.getByRole('dialog', { name: 'Send Inquiry' });
    await expect(dialog).toBeVisible();

    await dialog.getByLabel('Your Message').fill('Hi, is this room still available? I would like to schedule a visit.');

    // InquiryModal's success handler uses a native alert(), not a DOM
    // element - Playwright auto-dismisses unhandled dialogs, so it has
    // to be caught explicitly to assert on it at all.
    const alertPromise = page.waitForEvent('dialog');
    await dialog.getByRole('button', { name: 'Send Inquiry' }).click();
    const nativeAlert = await alertPromise;
    expect(nativeAlert.message()).toContain('Inquiry sent successfully');
    await nativeAlert.accept();
  });

  await test.step('tenant dashboard shows the inquiry', async () => {
    await page.goto('/tenant-dashboard');
    await expect(page.getByRole('heading', { name: listingTitle })).toBeVisible({ timeout: 10000 });
  });
});
