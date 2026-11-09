import { test, expect, Page } from '@playwright/test';
import { deleteAccount, smokePassword } from './helpers/api';
import { seedAccount } from './helpers/seed';
import { Account, createWish, input, login, newUserPage, wishCard } from './helpers/flows';

// Visuele baseline vóór de Angular-klim en Bootstrap 4 → 5 (sc-3277): screenshots van de kernschermen,
// op desktop en mobiel. De beelden zijn alleen vergelijkbaar op dezelfde renderer, dus draaien ze in CI
// (Linux) of met E2E_VISUAL=1; de baselines komen uit CI (zie docs/claude/ci.md).
// Vaste namen en titels, zodat de beelden stabiel zijn; datums en andere wisselende stukken worden gemaskerd.

test.skip(!process.env.CI && !process.env.E2E_VISUAL, 'Visuele baseline draait alleen in CI of met E2E_VISUAL=1');

const runId = `${Date.now().toString(36)}v`;
const owner: Account = { firstName: 'Smoke', lastName: 'Eigenaar', email: `smoke+owner-${runId}@gimmi.be`, password: smokePassword };
const giver: Account = { firstName: 'Smoke', lastName: 'Gever', email: `smoke+giver-${runId}@gimmi.be`, password: smokePassword };
const wensA = 'Baseline fiets';
const wensB = 'Baseline boek';

const formaten = [
  { naam: 'desktop', viewport: { width: 1280, height: 900 } },
  { naam: 'mobiel', viewport: { width: 375, height: 812 } }
];

async function shot(page: Page, naam: string, mask: ReturnType<Page['locator']>[] = []) {
  // Animaties (popups, dropdowns) uit en de cursor weg; de rest wacht tot het netwerk stil is.
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot(`${naam}.png`, { animations: 'disabled', caret: 'hide', fullPage: true, mask, maxDiffPixelRatio: 0.002 });
}

test.describe.configure({ mode: 'serial' });

test.describe('visuele baseline', () => {
  test.beforeAll(async () => {
    await seedAccount(owner);
    await seedAccount(giver);
  });

  test.afterAll(async () => {
    const fouten: string[] = [];
    for (const account of [giver, owner]) {
      if (!account.id) continue;
      try {
        await deleteAccount(account.email, account.password);
      } catch (err) {
        fouten.push(`${account.email}: ${(err as Error).message}`);
      }
    }
    if (fouten.length) throw new Error(['Opruimen mislukt, draai npm run e2e:cleanup:', ...fouten].join('\n'));
  });

  test('voorbereiding: eigenaar met twee wensen, gever', async ({ browser }) => {
    for (const [account, wensen] of [[owner, [wensA, wensB]], [giver, []]] as [Account, string[]][]) {
      const { context, page } = await newUserPage(browser);
      await login(page, account);
      for (const wens of wensen) await createWish(page, wens);
      await context.close();
    }
  });

  for (const { naam, viewport } of formaten) {
    test.describe(naam, () => {
      test.use({ viewport });

      test('publieke pagina’s', async ({ browser }) => {
        const { context, page } = await newUserPage(browser);
        for (const [pad, bestand] of [['/', 'landing'], ['/users/login', 'login'], ['/users/register', 'registreren'],
          ['/users/forgotpassword', 'wachtwoord-vergeten']]) {
          await page.goto(pad);
          await shot(page, `${naam}-${bestand}`);
        }
        await context.close();
      });

      test('eigen lijst, gebruikersmenu, delen en wens toevoegen', async ({ browser }) => {
        const { context, page } = await newUserPage(browser);
        await login(page, owner);
        await shot(page, `${naam}-eigen-lijst`);

        await page.getByText('Voeg wens toe').click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await shot(page, `${naam}-popup-wens-toevoegen`);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toBeHidden();

        await page.goto(`/users/${owner.id}`);
        await shot(page, `${naam}-mijn-gegevens`);
        await context.close();
      });

      test('andermans lijst: reserveren en feedback', async ({ browser }) => {
        const { context, page } = await newUserPage(browser);
        await login(page, giver);
        await page.goto(`/people/${owner.id}`);
        await expect(wishCard(page, wensA)).toBeVisible();
        await shot(page, `${naam}-andermans-lijst`);

        await wishCard(page, wensA).getByRole('button', { name: 'Reserveer' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        // De datum staat standaard op vandaag.
        await shot(page, `${naam}-popup-reserveren`, [page.locator('input[type="date"]')]);
        await context.close();
      });
    });
  }
});
