import { test, expect } from '@playwright/test';
import { clearWishes, newcomerEmail, smokeAccounts, smokePassword } from './helpers/api';
import { Account, login, newUserPage, requestRegistration, submitLogin, wishCard } from './helpers/flows';

// Smoketests voor de zes kernflows. De tests bouwen op elkaar (de wens die in
// test 3 wordt aangemaakt, wordt in test 4 gereserveerd), dus ze draaien serieel
// en delen de gebruikers hieronder. Eigenaar en gever zijn vaste accounts in de testdatabase (sc-3283, `npm run e2e:seed`);
// test 1 doorloopt stap 1 van de registratie in de UI (het verzoek wordt niet echt verstuurd, zie `requestRegistration`).
// Na afloop wist afterAll de wensen van beide accounts. Blijft er toch iets staan (run afgebroken): npm run e2e:cleanup.

const runId = Date.now().toString(36);
const password = smokePassword;
const owner: Account = { ...smokeAccounts.owner };
const giver: Account = { ...smokeAccounts.giver };
const wishTitle = `Smoke wens ${runId}`;

test.describe.configure({ mode: 'serial' });

test.describe('kernflows', () => {
  test.beforeAll(async () => {
    // Vaste accounts (sc-3283): begin met lege lijsten, ook na een afgebroken run.
    await clearWishes(owner);
    await clearWishes(giver);
  });

  test.afterAll(async () => {
    // Ook opruimen als een test halverwege faalde. Wie nooit geregistreerd werd (geen id), slaan we over.
    const fouten: string[] = [];
    for (const account of [giver, owner]) {
      try {
        await clearWishes(account);
      } catch (err) {
        fouten.push(`${account.email}: ${(err as Error).message}`);
      }
    }
    if (fouten.length) throw new Error(['Opruimen mislukt, draai npm run e2e:cleanup:', ...fouten].join('\n'));
  });

  test('1. registreren: het adres opgeven en de bevestigingsmail afwachten', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await requestRegistration(page, newcomerEmail);
    await context.close();
  });

  test('2. inloggen', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${owner.firstName} ${owner.lastName}`);
    await context.close();
  });

  test('2b. inloggen na een fout wachtwoord', async ({ browser }) => {
    // Een mislukte poging mag de terugkeer-URL niet op het loginscherm zetten; anders bleef je
    // na de geslaagde tweede poging op /users/login staan.
    const { context, page } = await newUserPage(browser);
    await page.goto('/users/login');
    await submitLogin(page, { ...owner, password: `${owner.password}-fout` });
    await expect(page.getByText('De combinatie emailadres / wachtwoord is niet correct.')).toBeVisible();
    await submitLogin(page, owner);
    await expect(page).toHaveURL(`/people/${owner.id}`);
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
    await login(page, giver);
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
    await dialog.locator('#receivedOn').fill(new Date().toISOString().substring(0, 10));
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
