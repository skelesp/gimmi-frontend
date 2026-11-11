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
  return { context, page: await context.newPage() };
}

// Registreren, stap 1 van 2 (sc-3285): het adres opgeven en de melding "controleer je mail" zien. Stap 2 vraagt het token uit
// de mail, en dat kan CI niet lezen; het verzoek wordt beantwoord zonder het te versturen, zodat er ook geen echte mail vertrekt.
export async function requestRegistration(page: Page, email: string): Promise<void> {
  await page.route(/\/api\/v2\/registrations$/, route => route.fulfill({ status: 202 }));
  await page.goto('/users/register');
  await input(page, 'Email (login)').fill(email);
  await page.getByRole('button', { name: 'Registreer' }).click();
  await expect(page.locator('#registrationSent')).toContainText(email);
}

export async function login(page: Page, account: Account): Promise<void> {
  await page.goto('/users/login');
  await submitLogin(page, account);
  await expect(page).toHaveURL(`/people/${account.id}`);
}

// Vult het loginformulier in en klikt op Login, zonder op het resultaat te wachten.
export async function submitLogin(page: Page, account: Account): Promise<void> {
  await input(page, 'Email (login)').fill(account.email);
  await input(page, 'Wachtwoord').fill(account.password);
  // De loginknop wordt pas actief als het formulier "touched" is.
  await input(page, 'Wachtwoord').blur();
  await page.getByRole('button', { name: 'Login', exact: true }).click();
}

export async function createWish(page: Page, title: string, price = '25'): Promise<void> {
  await page.getByText('Voeg wens toe').click();
  const dialog = page.getByRole('dialog');
  // Zonder zone.js bestaat het veld al vóór de eerste weergave en maakt die het weer leeg: eerst de titel van de popup afwachten.
  await expect(dialog.getByRole('heading', { name: 'Voeg een wens toe' })).toBeVisible();
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
