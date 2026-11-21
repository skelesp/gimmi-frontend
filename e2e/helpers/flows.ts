import { expect, Browser, BrowserContext, Page } from '@playwright/test';

// Shared steps for the e2e specs.

export interface Account { firstName: string; lastName: string; email: string; password: string; id?: string; }

// The placeholder is also on the host element of gimmi-password-input; so pick the <input>.
export function input(page: Page, placeholder: string) {
  return page.locator(`input[placeholder="${placeholder}"]`);
}

export function wishCard(page: Page, title: string) {
  return page.locator('gimmi-wish-card').filter({ hasText: title });
}

export async function newUserPage(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  return { context, page: await context.newPage() };
}

// Registering, step 1 of 2 (sc-3285): enter the address and see the "check your mail" notice. Step 2 needs the token from
// the mail, which CI cannot read; the request is answered without sending it, so no real mail goes out either.
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

// Fills in the login form and clicks Login, without waiting for the result.
export async function submitLogin(page: Page, account: Account): Promise<void> {
  await input(page, 'Email (login)').fill(account.email);
  await input(page, 'Wachtwoord').fill(account.password);
  // The login button only becomes active once the form is "touched".
  await input(page, 'Wachtwoord').blur();
  await page.getByRole('button', { name: 'Login', exact: true }).click();
}

export async function createWish(page: Page, title: string, price = '25'): Promise<void> {
  await page.getByText('Voeg wens toe').click();
  const dialog = page.getByRole('dialog');
  // Without zone.js the field already exists before the first render and that render empties it again: wait for the popup title first.
  await expect(dialog.getByRole('heading', { name: 'Voeg een wens toe' })).toBeVisible();
  await dialog.locator('#wishTitle').fill(title);
  await dialog.locator('#WishPrice').fill(price);
  await dialog.locator('button[type="submit"]').click();
  await expect(dialog).toBeHidden();
  await expect(wishCard(page, title)).toBeVisible();
}

/** Opens the action menu (three dots) of a wish card and picks an action. */
export async function wishAction(page: Page, title: string, action: string): Promise<void> {
  await wishCard(page, title).locator('gimmi-action-list [ngbdropdowntoggle]').click();
  // The menu hangs on <body> (container: 'body'), not in the card.
  await page.locator('.dropdown-menu.show').getByText(action, { exact: true }).click();
}
