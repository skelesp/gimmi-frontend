import { test, expect, Page } from '@playwright/test';
import { clearWishes, smokeAccounts } from './helpers/api';
import { Account, createWish, input, login, newUserPage, wishCard } from './helpers/flows';

// Visual baseline before the Angular climb and Bootstrap 4 → 5 (sc-3277): screenshots of the core screens,
// on desktop and mobile. The images are only comparable on the same renderer, so they run in CI
// (Linux) or with E2E_VISUAL=1; the baselines come from CI (see docs/claude/ci.md).
// Fixed names and titles, so the images are stable; dates and other changing parts are masked.

test.skip(!process.env.CI && !process.env.E2E_VISUAL, 'The visual baseline only runs in CI or with E2E_VISUAL=1');

const runId = `${Date.now().toString(36)}v`;
const owner: Account = { ...smokeAccounts.owner };
const giver: Account = { ...smokeAccounts.giver };
const wishA = 'Baseline bike';
const wishB = 'Baseline book';

const formats = [
  { name: 'desktop', viewport: { width: 1280, height: 900 } },
  { name: 'mobile', viewport: { width: 375, height: 812 } }
];

async function shot(page: Page, name: string, mask: ReturnType<Page['locator']>[] = []) {
  // Animations (popups, dropdowns) off and the caret hidden; the rest waits until the network is idle.
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot(`${name}.png`, { animations: 'disabled', caret: 'hide', fullPage: true, mask, maxDiffPixelRatio: 0.002 });
}

test.describe.configure({ mode: 'serial' });

test.describe('visual baseline', () => {
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

  test('preparation: owner with two wishes, giver', async ({ browser }) => {
    for (const [account, wishes] of [[owner, [wishA, wishB]], [giver, []]] as [Account, string[]][]) {
      const { context, page } = await newUserPage(browser);
      await login(page, account);
      for (const wish of wishes) await createWish(page, wish);
      await context.close();
    }
  });

  for (const { name, viewport } of formats) {
    test.describe(name, () => {
      test.use({ viewport });

      test('public pages', async ({ browser }) => {
        const { context, page } = await newUserPage(browser);
        for (const [path, file] of [['/', 'landing'], ['/users/login', 'login'], ['/users/register', 'register'],
          ['/users/forgotpassword', 'forgot-password']]) {
          await page.goto(path);
          await shot(page, `${name}-${file}`);
        }
        await context.close();
      });

      test('own list, user menu, sharing and adding a wish', async ({ browser }) => {
        const { context, page } = await newUserPage(browser);
        await login(page, owner);
        await shot(page, `${name}-own-list`);

        await page.getByText('Voeg wens toe').click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await shot(page, `${name}-popup-add-wish`);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toBeHidden();

        await page.goto(`/users/${owner.id}`);
        await shot(page, `${name}-my-details`);
        await context.close();
      });

      test('someone else’s list: reserve and feedback', async ({ browser }) => {
        const { context, page } = await newUserPage(browser);
        await login(page, giver);
        await page.goto(`/people/${owner.id}`);
        await expect(wishCard(page, wishA)).toBeVisible();
        await shot(page, `${name}-others-list`);

        await wishCard(page, wishA).getByRole('button', { name: 'Reserveer' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        // The date defaults to today.
        await shot(page, `${name}-popup-reserve`, [page.locator('input[type="date"]')]);
        await context.close();
      });
    });
  }
});
