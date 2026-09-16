// Shared helpers for creating real users through the actual signup UI -
// not direct DB inserts. Each call uses a timestamp+random suffix so
// repeated test runs never collide on the unique email index.

// Generates a value that's extremely unlikely to repeat across test runs,
// used to build unique emails/titles so tests never collide with leftover
// data from a previous run.
function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

// Drives the real /signup page end-to-end: picks a role, fills the form,
// submits, and waits for the redirect that confirms it actually worked -
// used at the start of most tests to get a logged-in user to test with.
async function signup(page, { role, name, email, password = 'TestPass123!' }) {
  await page.goto('/signup');
  // The role toggle is a pair of buttons, not a <select> - see
  // Signup.jsx - so "click the button named 'Renter'/'Tenant'" is how
  // a real user would pick a role too.
  await page.getByRole('button', { name: role, exact: true }).click();
  await page.getByLabel('Full name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /create account/i }).click();
  // Signup.jsx navigates to "/" on success.
  await page.waitForURL('/');
  return { email, password };
}

module.exports = { uniqueSuffix, signup };
