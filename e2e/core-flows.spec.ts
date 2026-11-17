import { test, expect } from '@playwright/test';
import { clearWishes, newcomerEmail, smokeAccounts, smokePassword } from './helpers/api';
import { Account, login, newUserPage, requestRegistration, submitLogin, wishCard } from './helpers/flows';

// Smoke tests for the six core flows. The tests build on each other (the wish created in
// test 3 is reserved in test 4), so they run serially and share the users below.
// Owner and giver are fixed accounts in the test database (sc-3283, `npm run e2e:seed`);
// test 1 goes through step 1 of the registration in the UI (the request is not really sent, see `requestRegistration`).
// Afterwards afterAll erases the wishes of both accounts. If something is left anyway (run aborted): npm run e2e:cleanup.

const runId = Date.now().toString(36);
const password = smokePassword;
const owner: Account = { ...smokeAccounts.owner };
const giver: Account = { ...smokeAccounts.giver };
const wishTitle = `Smoke wish ${runId}`;

test.describe.configure({ mode: 'serial' });

test.describe('core flows', () => {
  test.beforeAll(async () => {
    // Fixed accounts (sc-3283): start with empty lists, also after an aborted run.
    await clearWishes(owner);
    await clearWishes(giver);
  });

  test.afterAll(async () => {
    // Also clean up if a test failed halfway. Whoever was never registered (no id) is skipped.
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

  test('1. register: enter the address and wait for the confirmation mail', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await requestRegistration(page, newcomerEmail);
    await context.close();
  });

  test('2. log in', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${owner.firstName} ${owner.lastName}`);
    await context.close();
  });

  test('2b. log in after a wrong password', async ({ browser }) => {
    // A failed attempt must not set the return URL to the login screen; otherwise you stayed
    // on /users/login after the successful second attempt.
    const { context, page } = await newUserPage(browser);
    await page.goto('/users/login');
    await submitLogin(page, { ...owner, password: `${owner.password}-wrong` });
    await expect(page.getByText('De combinatie emailadres / wachtwoord is niet correct.')).toBeVisible();
    await submitLogin(page, owner);
    await expect(page).toHaveURL(`/people/${owner.id}`);
    await context.close();
  });

  test('3. create a wish', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await page.getByText('Voeg wens toe').click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('#wishTitle').fill(wishTitle);
    await dialog.locator('#WishPrice').fill('25');
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog).toBeHidden();
    await expect(wishCard(page, wishTitle)).toBeVisible();
    await context.close();
  });

  test('4. reserve', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, giver);
    await page.goto(`/people/${owner.id}`);
    const card = wishCard(page, wishTitle);
    await card.getByRole('button', { name: 'Reserveer' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('#reservationReason').selectOption({ label: 'Verjaardag' });
    await dialog.getByRole('button', { name: 'Reserveer', exact: true }).click();
    await expect(dialog).toBeHidden();
    // The handover date defaults to today, so the wish counts as received right away
    // (and the owner can give feedback in test 5).
    await expect(card).toContainText('Gegeven door jou');
    await context.close();
  });

  test('5. give feedback', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    const card = wishCard(page, wishTitle);
    await card.getByRole('button', { name: 'Geef feedback' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('ngb-rating fa-icon').nth(3).click();
    await dialog.locator('#receivedOn').fill(new Date().toISOString().substring(0, 10));
    await dialog.locator('#message').fill('Bedankt voor het cadeau!');
    await dialog.getByRole('button', { name: 'Feedback opslaan' }).click();
    await expect(dialog).toBeHidden();
    await page.getByText('Ontvangen cadeaus', { exact: true }).click();
    await expect(wishCard(page, wishTitle)).toBeVisible();
    await context.close();
  });

  test('6. share the wish list', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await page.locator('gimmi-share fa-icon').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Deel deze pagina' })).toBeVisible();
    await expect(dialog.locator('input[aria-label="wishlist link"]')).toHaveValue(new RegExp(`/people/${owner.id}$`));
    await context.close();
  });
});
