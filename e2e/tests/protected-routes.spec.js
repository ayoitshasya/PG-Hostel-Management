// Confirms the frontend's route guarding (ProtectedRoute.jsx) actually
// works from a real browser's perspective: visiting a gated URL directly
// redirects you if you're not allowed there, instead of just hiding a nav
// link (which wouldn't stop someone typing the URL in by hand).
const { test, expect } = require('@playwright/test');
const { uniqueSuffix, signup } = require('./helpers');

test.describe('role-protected routes', () => {
  // No login at all -> every gated route should bounce to /login.
  test('unauthenticated visitor is redirected to /login', async ({ page }) => {
    for (const path of ['/create-listing', '/renter-dashboard', '/tenant-dashboard']) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    }
  });

  // Logged in, but as the wrong role -> different redirect target than the
  // "not logged in at all" case above (see the comment on the assertion below).
  test('tenant is redirected away from renter-only routes', async ({ page }) => {
    const suffix = uniqueSuffix();
    await signup(page, { role: 'Tenant', name: 'Route Test Tenant', email: `route-tenant-${suffix}@example.com` });

    for (const path of ['/create-listing', '/renter-dashboard']) {
      await page.goto(path);
      // ProtectedRoute sends a role-mismatched user to "/", not /login
      // (they ARE authenticated, just not allowed on this specific route).
      await expect(page).toHaveURL(/\/$/);
    }

    // Their own role's route should still work.
    await page.goto('/tenant-dashboard');
    await expect(page).toHaveURL(/\/tenant-dashboard$/);
  });

  // Mirror image of the tenant test above, for the renter role.
  test('renter is redirected away from tenant-only routes', async ({ page }) => {
    const suffix = uniqueSuffix();
    await signup(page, { role: 'Renter', name: 'Route Test Renter', email: `route-renter-${suffix}@example.com` });

    await page.goto('/tenant-dashboard');
    await expect(page).toHaveURL(/\/$/);

    // Their own role's routes should still work.
    await page.goto('/renter-dashboard');
    await expect(page).toHaveURL(/\/renter-dashboard$/);
    await page.goto('/create-listing');
    await expect(page).toHaveURL(/\/create-listing$/);
  });
});
