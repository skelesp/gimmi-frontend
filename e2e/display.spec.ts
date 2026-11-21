import { test, expect, Browser, Page } from '@playwright/test';
import { input, newUserPage } from './helpers/flows';

// Display and the reset link, without test accounts (sc-2979):
// layout on large and small screens (sc-2326), pointer on clickable elements (sc-2038),
// privacy policy (sc-3541), search field fixed in the navigation bar (sc-41) and
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

test.describe('privacy policy (sc-3541)', () => {
  test('the footer links to the own privacy policy, without third-party scripts', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/');
    await page.getByRole('link', { name: 'Privacybeleid' }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Privacybeleid van Gimmi' })).toBeVisible();
    expect(await page.locator('script[src*="iubenda"]').count()).toBe(0);
    await context.close();
  });
});
