import { test, expect } from '@playwright/test';
import { deleteAccount, smokePassword } from './helpers/api';
import { Account, createWish, input, login, newUserPage, register, wishAction, wishCard } from './helpers/flows';

// Flows rond het beheren van wensen en navigeren, naast de zes kernflows (sc-2979):
// personen zoeken (sc-1988, sc-2033), reservatie verwijderen (sc-2515), wens kopiëren
// naar de eigen lijst (sc-2348), wens verwijderen (sc-1981), uitloggen (sc-1987),
// wachtwoord vergeten (sc-2004), paginatitel en footer (sc-2027, sc-2575), afbeelding
// zoeken en een eigen foto opladen (sc-3028).
// Serieel, met eigen gebruikers die afterAll weer opruimt (zelfde naamregels als e2e:cleanup).

const runId = `${Date.now().toString(36)}w`;
const password = smokePassword;
const owner: Account = { firstName: 'Smoke', lastName: 'Eigenaar', email: `smoke+owner-${runId}@gimmi.be`, password };
const giver: Account = { firstName: 'Smoke', lastName: 'Gever', email: `smoke+giver-${runId}@gimmi.be`, password };
const wensA = `Smoke reserveer ${runId}`;
const wensB = `Smoke kopie ${runId}`;

// Een rode PNG van 16x16 voor de foto-upload (sc-3028).
const rodePng = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAFklEQVR4nGO4Y+pKEmIY1TCqYfhqAABoxFYQwMZTpQAAAABJRU5ErkJggg==';

// Een opgeslagen afbeelding komt uit R2, via Image Transformations op het beelddomein (sc-2911).
const R2_BEELD = /\/cdn-cgi\/image\/[^/]+\/(dev\/)?wishes\/[0-9a-f-]{36}\.(jpg|png|gif|webp|avif)$/;

function overEenWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().substring(0, 10);
}

test.describe.configure({ mode: 'serial' });

test.describe('wensbeheer en navigatie', () => {
  test.afterAll(async () => {
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

  test('voorbereiding: eigenaar met twee wensen', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await register(page, owner);
    await createWish(page, wensA);
    await createWish(page, wensB);
    await context.close();
  });

  // Afbeeldingskiezer (sc-3028). Vaste titel: de backend bewaart zoekresultaten een dag per
  // zoekterm, dus Brave rekent hooguit één zoekopdracht per dag voor deze test.
  test('afbeelding zoeken en toevoegen aan een nieuwe wens', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await page.getByText('Voeg wens toe').click();
    // Twee popups boven elkaar: de wens-popup en de kiezer.
    const wens = page.locator('ngb-modal-window', { has: page.locator('#wishTitle') });
    await wens.locator('#wishTitle').fill('Smoke fiets');
    await wens.getByRole('button', { name: 'Kies afbeelding' }).click();

    const kiezer = page.getByRole('dialog', { name: 'Kies een afbeelding' });
    await expect(kiezer.getByRole('searchbox')).toHaveValue('Smoke fiets');
    const resultaten = kiezer.locator('button.resultaat');
    await expect(resultaten.first()).toBeVisible({ timeout: 15_000 });

    // Een bronsite kan weigeren (sc-2960): dan een melding en het volgende resultaat proberen.
    let gelukt = false;
    for (let i = 0; i < Math.min(await resultaten.count(), 6) && !gelukt; i++) {
      await resultaten.nth(i).click();
      await expect.poll(async () => await kiezer.count() === 0 || await kiezer.getByRole('alert').isVisible(),
        { timeout: 20_000 }).toBe(true);
      gelukt = await kiezer.count() === 0;
    }
    expect(gelukt, 'minstens één van de eerste zoekresultaten kan opgeladen worden').toBeTruthy();

    // Meteen de voorvertoning (thumbnail van het resultaat), niet eerst de oude afbeelding.
    await expect(wens.locator('gimmi-image-view img')).toHaveAttribute('src', /^https:\/\/imgs\.search\.brave\.com\//);
    await wens.locator('button[type="submit"]').click();
    await expect(wens).toBeHidden();
    await expect(wishCard(page, 'Smoke fiets').locator('img').first()).toHaveAttribute('src', R2_BEELD);
    await context.close();
  });

  test('een eigen foto opladen bij een nieuwe wens', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await page.getByText('Voeg wens toe').click();
    const wens = page.locator('ngb-modal-window', { has: page.locator('#wishTitle') });
    await wens.locator('#wishTitle').fill('Smoke foto');
    await wens.getByRole('button', { name: 'Kies afbeelding' }).click();
    const kiezer = page.getByRole('dialog', { name: 'Kies een afbeelding' });
    await kiezer.getByRole('tab', { name: 'Foto / bestand' }).click();
    await kiezer.locator('input[data-testid="bestand-kiezen"]').setInputFiles({
      name: 'foto.png', mimeType: 'image/png', buffer: Buffer.from(rodePng, 'base64')
    });
    await expect(kiezer).toHaveCount(0, { timeout: 20_000 });
    // Meteen de voorvertoning (de verkleinde foto), niet eerst de oude afbeelding.
    await expect(wens.locator('gimmi-image-view img')).toHaveAttribute('src', /^data:image\/jpeg;base64,/);
    await wens.locator('button[type="submit"]').click();
    await expect(wens).toBeHidden();
    await expect(wishCard(page, 'Smoke foto').locator('img').first()).toHaveAttribute('src', R2_BEELD);
    await context.close();
  });

  test('de wens-popup sluiten sluit ook de kiezer (sc-1391)', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await page.getByText('Voeg wens toe').click();
    const wens = page.locator('ngb-modal-window', { has: page.locator('#wishTitle') });
    await wens.getByRole('button', { name: 'Kies afbeelding' }).click();
    const kiezer = page.getByRole('dialog', { name: 'Kies een afbeelding' });
    await kiezer.getByRole('button', { name: 'Annuleer' }).click();
    await expect(kiezer).toHaveCount(0);
    await expect(wens).toBeVisible();
    // Escape sluit de bovenste popup (de kiezer) en daarna de wens-popup.
    await wens.getByRole('button', { name: 'Kies afbeelding' }).click();
    await expect(kiezer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(kiezer).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(wens).toHaveCount(0);
    await context.close();
  });

  test('paginatitel en footer', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await page.goto('/');
    await expect(page).toHaveTitle(/Gimmi/);
    await expect(page.locator('footer gimmi-privacy-policy a')).toHaveText('Privacy Policy');
    await page.goto('/users/login');
    await expect(page.locator('footer gimmi-privacy-policy a')).toBeVisible();
    await context.close();
  });

  test('personen zoeken: gevonden en niet gevonden', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await register(page, giver);
    const zoek = page.locator('#typeahead-basic');

    await zoek.fill('geen-persoon-met-deze-naam');
    await expect(page.locator('ngb-typeahead-window')).toContainText('Persoon niet gevonden');

    await zoek.fill('');
    await zoek.fill('Smoke Eigenaar');
    const resultaat = page.locator('ngb-typeahead-window button').filter({ hasText: 'Smoke Eigenaar' }).first();
    await expect(resultaat).toBeVisible();
    await resultaat.click();
    await expect(page).toHaveURL(/\/people\/[0-9a-f]{24}$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Smoke Eigenaar');
    await context.close();
  });

  test('reserveren met latere overhandiging en de reservatie weer verwijderen', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, giver);
    await page.goto(`/people/${owner.id}`);
    const kaart = wishCard(page, wensA);

    await kaart.getByRole('button', { name: 'Reserveer' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.locator('#handoverDate').fill(overEenWeek());
    await dialog.locator('#reservationReason').selectOption({ label: 'Verjaardag' });
    await dialog.getByRole('button', { name: 'Reserveer', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(kaart).toContainText('Gereserveerd door jou');

    await kaart.getByRole('button', { name: 'Verwijder reservatie' }).click();
    await expect(dialog.getByRole('heading', { name: 'Verwijder je reservatie' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Verwijder reservatie' }).click();
    await expect(dialog).toBeHidden();
    await expect(kaart.getByRole('button', { name: 'Reserveer' })).toBeVisible();
    await expect(kaart).not.toContainText('Gereserveerd door jou');
    await context.close();
  });

  test('wens kopiëren naar de eigen lijst', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, giver);
    await page.goto(`/people/${owner.id}`);
    await wishAction(page, wensB, 'Zet op eigen lijst');
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('#wishTitle')).toHaveValue(wensB);
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog).toBeHidden();

    await page.goto(`/people/${giver.id}`);
    await expect(wishCard(page, wensB)).toBeVisible();
    await context.close();
  });

  test('wens verwijderen, met bevestiging', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);

    await wishAction(page, wensA, 'Verwijderen');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText(`Ben je zeker dat je "${wensA}" wilt verwijderen?`);
    await dialog.getByRole('button', { name: 'Nee, wens behouden' }).click();
    await expect(wishCard(page, wensA)).toBeVisible();

    await wishAction(page, wensA, 'Verwijderen');
    await dialog.getByRole('button', { name: 'Ja, verwijder' }).click();
    await expect(wishCard(page, wensA)).toHaveCount(0);
    await page.reload();
    await expect(wishCard(page, wensB)).toBeVisible();
    await expect(wishCard(page, wensA)).toHaveCount(0);
    await context.close();
  });

  test('uitloggen', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    await login(page, owner);
    await page.locator('gimmi-user-menu [ngbdropdowntoggle]').click();
    await page.getByText('Uitloggen', { exact: true }).click();
    // logout() herlaadt de pagina; daarna staat het menu voor onbekende gebruikers er.
    await expect(page.locator('gimmi-user-menu')).toHaveCount(0);
    await expect(page.locator('gimmi-unknown-user-menu')).toHaveCount(1);
    expect(await page.evaluate(() => localStorage.getItem('currentUser'))).toBeNull();
    await context.close();
  });

  test('wachtwoord vergeten: aanvraag met het ingevulde adres', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    // De echte aanvraag zou een resetmail sturen; hier wordt enkel nagekeken wat de app verstuurt.
    let body: { email?: string; resetPasswordRoute?: string } = {};
    await context.route(/\/api\/people\/account\/local$/, async route => {
      body = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });
    await page.goto(`/users/forgotpassword?e=${encodeURIComponent(owner.email)}`);
    await expect(input(page, 'Emailadres van uw account')).toHaveValue(owner.email);
    await page.getByRole('button', { name: 'Vraag nieuw wachtwoord aan' }).click();
    await expect(page.locator('ngb-alert')).toContainText('Uw paswoord reset werd aangevraagd');
    expect(body.email).toBe(owner.email);
    expect(body.resetPasswordRoute).toMatch(/\/users\/resetpassword$/);
    await context.close();
  });
});
