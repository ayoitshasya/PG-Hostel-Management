// Shared helpers for creating real users through the actual signup UI -
// not direct DB inserts. Each call uses a timestamp+random suffix so
// repeated test runs never collide on the unique email index.
function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

async function signup(page, { role, name, email, password = 'TestPass123!' }) {
  await page.goto('/signup');
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
