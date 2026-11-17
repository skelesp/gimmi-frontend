import { test, expect, Browser, Page } from '@playwright/test';
import { input, newUserPage } from './helpers/flows';

// Display and the reset link, without test accounts (sc-2979):
// layout on large and small screens (sc-2326), pointer on clickable elements (sc-2038),
// iubenda cookie policy (sc-2030), search field fixed in the navigation bar (sc-41) and
// resetting the password with the link from the mail (sc-2004).

async function openPage(browser: Browser, width: number, height = 900): Promise<Page> {
  const { context, page } = await newUserPage(browser);
  await page.setViewportSize({ width, height });
  test.info().annotations.push({ type: 'viewport', description: `${width}x${height}` });
  page.on('close', () => context.close());
  return page;
}

/** Width of the content versus the window width, and whether the page scrolls sideways. */
async function measure(page: Page) {
  return page.evaluate(() => ({
    windowWidth: window.innerWidth,
    content: document.querySelector('gimmi-root > .container-fluid').getBoundingClientRect().width,
    sideways: document.documentElement.scrollWidth > window.innerWidth
  }));
}

test.describe('display', () => {
  test('large screen: the content uses the full width, banner for large screens (sc-2326)', async ({ browser }) => {
    const page = await openPage(browser, 1920, 1080);
    await page.goto('/');
    await expect(page.locator('.jumbotron.d-md-block')).toBeVisible();
    await expect(page.locator('.jumbotron.d-md-none')).toBeHidden();
    const m = await measure(page);
    expect(m.content).toBeGreaterThan(m.windowWidth * 0.95);
    expect(m.sideways).toBe(false);
    await page.close();
  });

  test('small screen: banner for small screens, nothing runs off sideways (sc-2326)', async ({ browser }) => {
    const page = await openPage(browser, 375, 812);
    await page.goto('/');
    await expect(page.locator('.jumbotron.d-md-none')).toBeVisible();
    await expect(page.locator('.jumbotron.d-md-block')).toBeHidden();
    expect((await measure(page)).sideways).toBe(false);
    await page.close();
  });

  test('small screen: search field stays in the bar, menu collapsed, search icon gone (sc-41)', async ({ browser }) => {
    const page = await openPage(browser, 375, 812);
    await page.goto('/');
    await expect(input(page, 'Zoek wensenlijst van...')).toBeVisible();
    await expect(page.locator('gimmi-people-search .input-group-text')).toBeHidden();
    await expect(page.locator('nav .navbar-collapse')).toBeHidden();
    await page.locator('button.navbar-toggler').click();
    await expect(page.locator('nav .navbar-collapse gimmi-unknown-user-menu')).toBeVisible();
    await expect(input(page, 'Zoek wensenlijst van...')).toBeVisible();
    await page.close();
  });

  test('large screen: search field with search icon, no menu button (sc-41)', async ({ browser }) => {
    const page = await openPage(browser, 1280);
    await page.goto('/');
    await expect(page.locator('gimmi-people-search .input-group-text')).toBeVisible();
    await expect(page.locator('button.navbar-toggler')).toBeHidden();
    await page.close();
  });

  test('pointer on clickable elements, not on plain text (sc-2038)', async ({ browser }) => {
    const page = await openPage(browser, 375, 812);
    await page.goto('/');
    const cursor = (selector: string) => page.locator(selector).first().evaluate(e => getComputedStyle(e).cursor);
    expect(await cursor('button.navbar-toggler')).toBe('pointer');                 // (click)
    expect(await cursor('gimmi-how-to-use fa-icon.text-danger')).toBe('pointer');             // routerLink
    expect(await cursor('gimmi-how-to-use p.text-muted')).not.toBe('pointer');
    await page.close();
  });
});

test.describe('cookie policy (sc-2030)', () => {
  test('the iubenda cookie banner is loaded with the Gimmi cookie policy', async ({ browser }) => {
    // Own context: newUserPage blocks iubenda. The script is requested here,
    // but not really executed: the test checks that it is loaded and how it is configured.
    const context = await browser.newContext();
    const requested: string[] = [];
    await context.route(/iubenda\.com/, route => {
      requested.push(route.request().url());
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    });
    const page = await context.newPage();
    await page.goto('/');
    await expect.poll(() => requested.some(u => u.endsWith('/cs/iubenda_cs.js'))).toBe(true);
    const config = await page.evaluate(() => (window as any)._iub.csConfiguration);
    expect(config).toMatchObject({
      lang: 'nl',
      siteId: 929007,
      cookiePolicyId: 8245579,
      askConsentAtCookiePolicyUpdate: true,
      banner: { acceptButtonDisplay: true, customizeButtonDisplay: true, listPurposes: true }
    });
    await context.close();
  });
});

test.describe('resetting the password with the link from the mail (sc-2004)', () => {
  test('invalid link: explanation and a link to request a new one', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    // Real API: a made-up token does not exist and gives 404.
    await page.goto(`/users/resetpassword/does-not-exist-${Date.now().toString(36)}`);
    await expect(page.locator('ngb-alert')).toContainText('Uw link is ofwel vervallen (= ouder dan 1u) of ongeldig.');
    await expect(page.locator('gimmi-reset-password form')).toHaveCount(0);
    await page.locator('ngb-alert gimmi-forgot-password-link a').click();
    await expect(page).toHaveURL(/\/users\/forgotpassword/);
    await context.close();
  });

  test('valid link: choose a new password and be logged in right away', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    // The token from the mail can only be found in the mail (or the database). The API responses
    // for that token are therefore mocked; the real reset flow is in the backend tests.
    const token = 'e2e-token-' + Date.now().toString(36);
    const api = '/api/v2/';
    let newPassword: string;
    await context.route(new RegExp(api + 'password-resets/' + token + '$'), async route => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ firstName: 'Smoke', expiresAt: new Date(Date.now() + 3600_000).toISOString() }) });
      }
      newPassword = route.request().postDataJSON().password;
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ token: 'e2e-session', tokenType: 'Bearer', expiresAt: new Date(Date.now() + 7 * 24 * 3600_000).toISOString() }) });
    });
    await context.route(new RegExp(api + 'me$'), route => route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: '5e2e00000000000000000009', email: 'smoke+reset@gimmi.be', firstName: 'Smoke', lastName: 'Reset', createdAt: '2026-01-01T00:00:00Z' }) }));
    // The list of the new session need not really exist; what matters is the redirect.
    await context.route(new RegExp(api + 'people/5e2e00000000000000000009'),route => route.fulfill({ status: 404, body: '{}' }));

    await page.goto('/users/resetpassword/' + token);
    await expect(page.getByRole('heading', { name: 'Vervang je vergeten paswoord' })).toBeVisible();
    const button = page.getByRole('button', { name: 'Wijzig wachtwoord' });
    await input(page, 'Wachtwoord').fill('Nieuw-geheim-1');
    await input(page, 'Geef wachtwoord nogmaals in').fill('Iets-anders-1');
    await input(page, 'Geef wachtwoord nogmaals in').blur();
    await expect(button).toBeDisabled();
    await input(page, 'Geef wachtwoord nogmaals in').fill('Nieuw-geheim-1');
    await input(page, 'Geef wachtwoord nogmaals in').blur();
    await button.click();

    await expect(page.getByText('Wachtwoord aangepast')).toBeVisible();
    await expect(page).toHaveURL(/\/people\/5e2e00000000000000000009$/);
    expect(newPassword).toBe('Nieuw-geheim-1');
    await context.close();
  });
});
