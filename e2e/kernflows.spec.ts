import { test, expect } from '@playwright/test';
import { deleteAccount, smokePassword } from './helpers/api';
import { Account, login, newUserPage, register, wishCard } from './helpers/flows';

// Smoketests voor de zes kernflows. De tests bouwen op elkaar (de wens die in
// test 3 wordt aangemaakt, wordt in test 4 gereserveerd), dus ze draaien serieel
// en delen de gebruikers hieronder. Na afloop verwijdert afterAll de gebruikers en hun
// wensen weer via de API. Blijft er toch iets staan (run afgebroken): npm run e2e:cleanup.

const runId = Date.now().toString(36);
const password = smokePassword;
const owner: Account = { firstName: 'Smoke', lastName: 'Eigenaar', email: `smoke+owner-${runId}@gimmi.be`, password };
const giver: Account = { firstName: 'Smoke', lastName: 'Gever', email: `smoke+giver-${runId}@gimmi.be`, password };
const wishTitle = `Smoke wens ${runId}`;

test.describe.configure({ mode: 'serial' });

test.describe('kernflows', () => {
  test.afterAll(async () => {
    // Ook opruimen als een test halverwege faalde. Wie nooit geregistreerd werd (geen id), slaan we over.
    const fouten: string[] = [];
    for (const account of [giver, owner]) {
      if (!account.id) continue;
      try {
        await deleteAccount(account.id, account.email, account.password);
      } catch (err) {
        fouten.push(`${account.email}: ${(err as Error).message}`);
      }
    }
    if (fouten.length) throw new Error(['Opruimen mislukt, draai npm run e2e:cleanup:', ...fouten].join('\n'));
  });

  test('1. registreren', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await register(page, owner);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${owner.firstName} ${owner.lastName}`);
    await context.close();
  });

  test('2. inloggen', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${owner.firstName} ${owner.lastName}`);
    await context.close();
  });

  test('3. wens aanmaken', async ({ browser }) => {
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

  test('4. reserveren', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await register(page, giver);
    await page.goto(`/people/${owner.id}`);
    const card = wishCard(page, wishTitle);
    await card.getByRole('button', { name: 'Reserveer' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('#reservationReason').selectOption({ label: 'Verjaardag' });
    await dialog.getByRole('button', { name: 'Reserveer', exact: true }).click();
    await expect(dialog).toBeHidden();
    // De overhandigingsdatum staat standaard op vandaag, dus de wens geldt meteen als ontvangen
    // (en de eigenaar kan in test 5 feedback geven).
    await expect(card).toContainText('Gegeven door jou');
    await context.close();
  });

  test('5. feedback geven', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    const card = wishCard(page, wishTitle);
    await card.getByRole('button', { name: 'Geef feedback' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('ngb-rating fa-icon').nth(3).click();
    await dialog.locator('input[formcontrolname="receivedOn"]').fill(new Date().toISOString().substring(0, 10));
    await dialog.locator('#message').fill('Bedankt voor het cadeau!');
    await dialog.getByRole('button', { name: 'Feedback opslaan' }).click();
    await expect(dialog).toBeHidden();
    await page.getByText('Ontvangen cadeaus', { exact: true }).click();
    await expect(wishCard(page, wishTitle)).toBeVisible();
    await context.close();
  });

  test('6. wenslijst delen', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await page.locator('gimmi-share fa-icon').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: 'Deel deze pagina' })).toBeVisible();
    await expect(dialog.locator('input[aria-label="wishlist link"]')).toHaveValue(new RegExp(`/people/${owner.id}$`));
    await context.close();
  });
});
