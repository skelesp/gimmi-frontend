import { test, expect } from '@playwright/test';
import { clearWishes, smokeAccounts } from './helpers/api';
import { Account, createWish, input, login, newUserPage, submitLogin, wishAction, wishCard } from './helpers/flows';

// Flows around managing wishes and navigating, next to the six core flows (sc-2979):
// searching people (sc-1988, sc-2033), removing a reservation (sc-2515), copying a wish
// to the own list (sc-2348), deleting a wish (sc-1981), logging out (sc-1987),
// forgotten password (sc-2004), page title and footer (sc-2027, sc-2575), searching an image
// and uploading an own photo (sc-3028).
// Serial, with own users that exist as fixed accounts in the test database (sc-3283, `npm run e2e:seed`) and that afterAll cleans up again
// (same naming rules as e2e:cleanup).

const runId = `${Date.now().toString(36)}w`;
const owner: Account = { ...smokeAccounts.owner };
const giver: Account = { ...smokeAccounts.giver };
const wishA = `Smoke reserve ${runId}`;
const wishB = `Smoke copy ${runId}`;

// A red 16x16 PNG for the photo upload (sc-3028).
const redPng = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAFklEQVR4nGO4Y+pKEmIY1TCqYfhqAABoxFYQwMZTpQAAAABJRU5ErkJggg==';

// A stored image comes from R2, via Image Transformations on the image domain (sc-2911).
// Image Transformations cannot process an AVIF: that comes as the original (sc-3231).
const R2_IMAGE = /(\/cdn-cgi\/image\/[^/]+\/(dev\/)?wishes\/[0-9a-f-]{36}\.(jpg|png|gif|webp)|\/(dev\/)?wishes\/[0-9a-f-]{36}\.avif)$/;

function inOneWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().substring(0, 10);
}

test.describe.configure({ mode: 'serial' });

test.describe('wish management and navigation', () => {
  test.beforeAll(async () => {
    // Fixed accounts (sc-3283): start with empty lists, also after an aborted run.
    await clearWishes(owner);
    await clearWishes(giver);
  });

  test.afterAll(async () => {
    const errors: string[] = [];
    for (const account of [giver, owner]) {
      try {
        await clearWishes(account);
      } catch (err) {
        errors.push(`${account.email}: ${(err as Error).message}`);
      }
    }
    if (errors.length) throw new Error(['Cleanup failed, run npm run e2e:cleanup:', ...errors].join('\n'));
  });

  test('preparation: owner with two wishes', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await createWish(page, wishA);
    await createWish(page, wishB);
    await context.close();
  });

  test('shared list link without login: log in first, then the list (sc-3167)', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await page.goto(`/people/${owner.id}`);
    await expect(page).toHaveURL(/\/users\/login/);
    await expect(page.getByText('klik hier om te registreren')).toBeVisible();
    await submitLogin(page, owner);
    await expect(page).toHaveURL(`/people/${owner.id}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Smoke Eigenaar');
    await context.close();
  });

  // Image picker (sc-3028). Fixed title: the backend keeps search results for a day per
  // query, so Brave charges at most one search per day for this test.
  test('search an image and add it to a new wish', async ({ browser }) => {
    test.setTimeout(150_000);   // up to six attempts of at most 20 s each if source sites refuse
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await page.getByText('Voeg wens toe').click();
    // Two popups on top of each other: the wish popup and the picker.
    const wish = page.locator('ngb-modal-window', { has: page.locator('#wishTitle') });
    await wish.locator('#wishTitle').fill('Smoke fiets');
    await wish.getByRole('button', { name: 'Kies afbeelding' }).click();

    const picker = page.getByRole('dialog', { name: 'Kies een afbeelding' });
    await expect(picker.getByRole('searchbox')).toHaveValue('Smoke fiets');
    const results = picker.locator('button.result');
    await expect(results.first()).toBeVisible({ timeout: 15_000 });

    // A source site can refuse (sc-2960): then a notice and try the next result.
    let succeeded = false;
    for (let i = 0; i < Math.min(await results.count(), 6) && !succeeded; i++) {
      await results.nth(i).click();
      // First wait for the render of the click (the clicked button is disabled), because before that the old notice is still there.
      await expect.poll(async () => await picker.count() === 0 || await results.nth(i).isDisabled({ timeout: 1_000 }).catch(() => true),
        { timeout: 10_000 }).toBe(true);
      // Done = the picker is gone, or there is a notice and another result is clickable again. Waiting only for the notice
      // does not work: the one from a previous attempt stays until the render refreshes, and during the upload and
      // the closing of the picker all results are disabled or still clickable without a notice.
      await expect.poll(async () => await picker.count() === 0 || (await picker.getByRole('alert').isVisible()
        && await results.evaluateAll((buttons, index) => buttons.some((button, k) => k !== index && !(button as HTMLButtonElement).disabled), i)),
        { timeout: 20_000 }).toBe(true);
      succeeded = await picker.count() === 0;
    }
    expect(succeeded, 'at least one of the first search results can be uploaded').toBeTruthy();

    // The preview (thumbnail of the result) right away, not the old image first.
    await expect(wish.locator('gimmi-image-view img')).toHaveAttribute('src', /^https:\/\/imgs\.search\.brave\.com\//);
    await wish.locator('button[type="submit"]').click();
    await expect(wish).toBeHidden();
    const image = wishCard(page, 'Smoke fiets').locator('img').first();
    await expect(image).toHaveAttribute('src', R2_IMAGE);
    // Really loaded, not silently fallen back on the default image (sc-3231).
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0
      && !img.currentSrc.endsWith('default-wish.jpg')), { timeout: 15_000 }).toBe(true);
    await context.close();
  });

  test('upload an own photo for a new wish', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await page.getByText('Voeg wens toe').click();
    const wish = page.locator('ngb-modal-window', { has: page.locator('#wishTitle') });
    await wish.locator('#wishTitle').fill('Smoke foto');
    await wish.getByRole('button', { name: 'Kies afbeelding' }).click();
    const picker = page.getByRole('dialog', { name: 'Kies een afbeelding' });
    await picker.getByRole('tab', { name: 'Foto / bestand' }).click();
    await picker.locator('input[data-testid="choose-file"]').setInputFiles({
      name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from(redPng, 'base64')
    });
    await expect(picker).toHaveCount(0, { timeout: 20_000 });
    // The preview (the resized photo) right away, not the old image first.
    await expect(wish.locator('gimmi-image-view img')).toHaveAttribute('src', /^blob:/);
    await wish.locator('button[type="submit"]').click();
    await expect(wish).toBeHidden();
    await expect(wishCard(page, 'Smoke foto').locator('img').first()).toHaveAttribute('src', R2_IMAGE);
    await context.close();
  });

  // The list now has wishes with and without an image, one of them the 16x16 photo above.
  // One login for both checks: the test API allows a limited number of logins per address and IP.
  test('hovering over a wish card moves nothing (sc-792); on a small screen every card is as wide as its column (sc-1877)', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await expect(wishCard(page, 'Smoke foto')).toBeVisible();
    const cards = page.locator('.card-columns .card');
    const boxes = () => cards.evaluateAll(all => all.map(card => JSON.stringify(card.getBoundingClientRect())));
    // A late image changes the height of its card: start from a layout that holds for a second.
    let before: string[] = [];
    await expect.poll(async () => {
      const previous = before;
      before = await boxes();
      return JSON.stringify(before) === JSON.stringify(previous);
    }, { intervals: [1_000], timeout: 20_000 }).toBe(true);
    // The overlay with the banner lies on top of the image.
    for (const part of ['gimmi-wish-call-to-action-button', 'a.wish-card-title', '.card-img-overlay']) {
      await wishCard(page, wishA).locator(part).first().hover();
      expect(await boxes(), `hover over ${part}`).toEqual(before);
    }

    await page.setViewportSize({ width: 375, height: 812 });
    const widths = await cards.evaluateAll(all => all.map(card => Math.round(card.getBoundingClientRect().width)));
    expect(widths.length).toBeGreaterThan(3);
    expect(new Set(widths).size, `card widths ${widths.join(', ')}`).toBe(1);
    await context.close();
  });

  test('touch screen: one tap on save adds a wish with only a title (sc-1875)', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    await login(page, owner);
    await page.getByText('Voeg wens toe').tap();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Voeg een wens toe' })).toBeVisible();
    await dialog.locator('#wishTitle').tap();
    await page.keyboard.type('Smoke tik');
    await dialog.getByRole('button', { name: 'Wens toevoegen' }).tap();
    await expect(dialog).toBeHidden();
    await expect(wishCard(page, 'Smoke tik')).toBeVisible();
    await context.close();
  });

  test('closing the wish popup also closes the picker (sc-1391)', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await page.getByText('Voeg wens toe').click();
    const wish = page.locator('ngb-modal-window', { has: page.locator('#wishTitle') });
    await wish.getByRole('button', { name: 'Kies afbeelding' }).click();
    const picker = page.getByRole('dialog', { name: 'Kies een afbeelding' });
    await picker.getByRole('button', { name: 'Annuleer' }).click();
    await expect(picker).toHaveCount(0);
    await expect(wish).toBeVisible();
    // Escape closes the top popup (the picker) and then the wish popup.
    await wish.getByRole('button', { name: 'Kies afbeelding' }).click();
    await expect(picker).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(picker).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(wish).toHaveCount(0);
    await context.close();
  });

  test('page title and footer', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await page.goto('/');
    await expect(page).toHaveTitle(/Gimmi/);
    await expect(page.locator('footer a[href="/privacy"]')).toHaveText('Privacybeleid');
    await page.goto('/users/login');
    await expect(page.locator('footer a[href="/privacy"]')).toBeVisible();
    await context.close();
  });

  test('searching people: found and not found', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, giver);
    const search = page.locator('#typeahead-basic');

    await search.fill('geen-persoon-met-deze-naam');
    await expect(page.locator('ngb-typeahead-window')).toContainText('Persoon niet gevonden');

    await search.fill('');
    await search.fill('Smoke Eigenaar');
    const found = page.locator('ngb-typeahead-window button').filter({ hasText: 'Smoke Eigenaar' }).first();
    await expect(found).toBeVisible();
    await found.click();
    await expect(page).toHaveURL(/\/people\/[0-9a-f]{24}$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Smoke Eigenaar');
    await context.close();
  });

  test('reserve with later handover and remove the reservation again', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, giver);
    await page.goto(`/people/${owner.id}`);
    const card = wishCard(page, wishA);

    await card.getByRole('button', { name: 'Reserveer' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('#handoverDate').fill(inOneWeek());
    await dialog.locator('#reservationReason').selectOption({ label: 'Verjaardag' });
    await dialog.getByRole('button', { name: 'Reserveer', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(card).toContainText('Gereserveerd door jou');

    await card.getByRole('button', { name: 'Verwijder reservatie' }).click();
    await expect(dialog.getByRole('heading', { name: 'Verwijder je reservatie' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Verwijder reservatie' }).click();
    await expect(dialog).toBeHidden();
    await expect(card.getByRole('button', { name: 'Reserveer' })).toBeVisible();
    await expect(card).not.toContainText('Gereserveerd door jou');
    await context.close();
  });

  test('copy a wish to the own list', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, giver);
    await page.goto(`/people/${owner.id}`);
    await wishAction(page, wishB, 'Zet op eigen lijst');
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('#wishTitle')).toHaveValue(wishB);
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog).toBeHidden();

    await page.goto(`/people/${giver.id}`);
    await expect(wishCard(page, wishB)).toBeVisible();
    await context.close();
  });

  test('delete a wish, with confirmation', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);

    await wishAction(page, wishA, 'Verwijderen');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(`Ben je zeker dat je "${wishA}" wilt verwijderen?`);
    await dialog.getByRole('button', { name: 'Nee, wens behouden' }).click();
    await expect(wishCard(page, wishA)).toBeVisible();

    await wishAction(page, wishA, 'Verwijderen');
    await dialog.getByRole('button', { name: 'Ja, verwijder' }).click();
    await expect(wishCard(page, wishA)).toHaveCount(0);
    await page.reload();
    await expect(wishCard(page, wishB)).toBeVisible();
    await expect(wishCard(page, wishA)).toHaveCount(0);
    await context.close();
  });

  test('log out', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await page.locator('gimmi-user-menu [ngbdropdowntoggle]').click();
    await page.getByText('Uitloggen', { exact: true }).click();
    // logout() reloads the page; after that the menu for unknown users is there.
    await expect(page.locator('gimmi-user-menu')).toHaveCount(0);
    await expect(page.locator('gimmi-unknown-user-menu')).toHaveCount(1);
    expect(await page.evaluate(() => localStorage.getItem('currentUser'))).toBeNull();
    await context.close();
  });

  test('forgotten password: request with the entered address', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    // The real request would send a reset mail; here we only check what the app sends.
    let body: { email?: string } = {};
    await context.route(/\/api\/v2\/password-resets$/, async route => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 202 });
    });
    await page.goto(`/users/forgotpassword?e=${encodeURIComponent(owner.email)}`);
    await expect(input(page, 'Emailadres van uw account')).toHaveValue(owner.email);
    await page.getByRole('button', { name: 'Vraag nieuw wachtwoord aan' }).click();
    await expect(page.locator('ngb-alert')).toContainText('Uw paswoord reset werd aangevraagd');
    expect(body.email).toBe(owner.email);
    await context.close();
  });
});
