import { expect, Browser, BrowserContext, Page } from '@playwright/test';

// Gedeelde stappen voor de e2e-specs.

export interface Account { firstName: string; lastName: string; email: string; password: string; id?: string; }

// De placeholder staat ook op het host-element van gimmi-password-input; kies dus de <input>.
export function input(page: Page, placeholder: string) {
  return page.locator(`input[placeholder="${placeholder}"]`);
}

export function wishCard(page: Page, title: string) {
  return page.locator('gimmi-wish-card').filter({ hasText: title });
}

export async function newUserPage(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  // De iubenda-cookiebanner ligt over de pagina en onderschept klikken; hij hoort niet bij deze flows.
  await context.route(/iubenda\.com/, route => route.abort());
  // Geen echte mails: de smoke-adressen @gimmi.be komen sinds 11-10-2026 via de catch-all van
  // Cloudflare Email Routing in een echte Gmail terecht. Het versturen zelf valt buiten deze tests.
  await context.route(/\/api\/email$/, route => route.fulfill({ status: 200, contentType: 'application/json', body: '"ok"' }));
  return { context, page: await context.newPage() };
}

export async function register(page: Page, account: Account): Promise<void> {
  await page.goto('/users/register');
  await page.locator('input[formcontrolname="firstName"]').fill(account.firstName);
  await page.locator('input[formcontrolname="lastName"]').fill(account.lastName);
  await page.locator('input[formcontrolname="birthday"]').fill('1990-05-17');
  await input(page, 'Email (login)').fill(account.email);
  await input(page, 'Wachtwoord').fill(account.password);
  await input(page, 'Geef wachtwoord nogmaals in').fill(account.password);
  await page.getByRole('button', { name: 'Registreer' }).click();
  await expect(page).toHaveURL(/\/people\/[0-9a-f]{24}$/);
  account.id = page.url().split('/').pop();
}

export async function login(page: Page, account: Account): Promise<void> {
  await page.goto('/users/login');
  await input(page, 'Email (login)').fill(account.email);
  await input(page, 'Wachtwoord').fill(account.password);
  // De loginknop wordt pas actief als het formulier "touched" is.
  await input(page, 'Wachtwoord').blur();
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL(`/people/${account.id}`);
}

export async function createWish(page: Page, title: string, price = '25'): Promise<void> {
  await page.getByText('Voeg wens toe').click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('#wishTitle').fill(title);
  await dialog.locator('#WishPrice').fill(price);
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog).toBeHidden();
  await expect(wishCard(page, title)).toBeVisible();
}

/** Opent het actiemenu (drie puntjes) van een wenskaart en kiest een actie. */
export async function wishAction(page: Page, title: string, action: string): Promise<void> {
  await wishCard(page, title).locator('gimmi-action-list [ngbdropdowntoggle]').click();
  // Het menu hangt aan <body> (container: 'body'), niet in de kaart.
  await page.locator('.dropdown-menu.show').getByText(action, { exact: true }).click();
}
