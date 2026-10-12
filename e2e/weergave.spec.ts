import { test, expect, Browser, Page } from '@playwright/test';
import { input, newUserPage } from './helpers/flows';

// Weergave en de resetlink, zonder testaccounts (sc-2979):
// layout op grote en kleine schermen (sc-2326), pointer op klikbare elementen (sc-2038),
// cookiebeleid van iubenda (sc-2030), zoekveld vast in de navigatiebalk (sc-41) en
// wachtwoord resetten met de link uit de mail (sc-2004).

async function pagina(browser: Browser, breedte: number, hoogte = 900): Promise<Page> {
  const { context, page } = await newUserPage(browser);
  await page.setViewportSize({ width: breedte, height: hoogte });
  test.info().annotations.push({ type: 'viewport', description: `${breedte}x${hoogte}` });
  page.on('close', () => context.close());
  return page;
}

/** Breedte van de inhoud tegenover de vensterbreedte, en of de pagina zijwaarts scrolt. */
async function maten(page: Page) {
  return page.evaluate(() => ({
    venster: window.innerWidth,
    inhoud: document.querySelector('gimmi-root > .container-fluid').getBoundingClientRect().width,
    zijwaarts: document.documentElement.scrollWidth > window.innerWidth
  }));
}

test.describe('weergave', () => {
  test('groot scherm: de inhoud gebruikt de volle breedte, banner voor grote schermen (sc-2326)', async ({ browser }) => {
    const page = await pagina(browser, 1920, 1080);
    await page.goto('/');
    await expect(page.locator('.jumbotron.d-md-block')).toBeVisible();
    await expect(page.locator('.jumbotron.d-md-none')).toBeHidden();
    const m = await maten(page);
    expect(m.inhoud).toBeGreaterThan(m.venster * 0.95);
    expect(m.zijwaarts).toBe(false);
    await page.close();
  });

  test('klein scherm: banner voor kleine schermen, niets loopt zijwaarts uit beeld (sc-2326)', async ({ browser }) => {
    const page = await pagina(browser, 375, 812);
    await page.goto('/');
    await expect(page.locator('.jumbotron.d-md-none')).toBeVisible();
    await expect(page.locator('.jumbotron.d-md-block')).toBeHidden();
    expect((await maten(page)).zijwaarts).toBe(false);
    await page.close();
  });

  test('klein scherm: zoekveld blijft in de balk, menu ingeklapt, zoekicoon weg (sc-41)', async ({ browser }) => {
    const page = await pagina(browser, 375, 812);
    await page.goto('/');
    await expect(input(page, 'Zoek wensenlijst van...')).toBeVisible();
    await expect(page.locator('gimmi-people-search .input-group-prepend')).toBeHidden();
    await expect(page.locator('nav .navbar-collapse')).toBeHidden();
    await page.locator('button.navbar-toggler').click();
    await expect(page.locator('nav .navbar-collapse gimmi-unknown-user-menu')).toBeVisible();
    await expect(input(page, 'Zoek wensenlijst van...')).toBeVisible();
    await page.close();
  });

  test('groot scherm: zoekveld met zoekicoon, geen menuknop (sc-41)', async ({ browser }) => {
    const page = await pagina(browser, 1280);
    await page.goto('/');
    await expect(page.locator('gimmi-people-search .input-group-prepend')).toBeVisible();
    await expect(page.locator('button.navbar-toggler')).toBeHidden();
    await page.close();
  });

  test('pointer op klikbare elementen, niet op gewone tekst (sc-2038)', async ({ browser }) => {
    const page = await pagina(browser, 375, 812);
    await page.goto('/');
    const cursor = (selector: string) => page.locator(selector).first().evaluate(e => getComputedStyle(e).cursor);
    expect(await cursor('button.navbar-toggler')).toBe('pointer');                 // (click)
    expect(await cursor('gimmi-how-to-use fa-icon.text-danger')).toBe('pointer');             // routerLink
    expect(await cursor('gimmi-how-to-use p.text-muted')).not.toBe('pointer');
    await page.close();
  });
});

test.describe('cookiebeleid (sc-2030)', () => {
  test('de iubenda-cookiebanner wordt geladen met het cookiebeleid van Gimmi', async ({ browser }) => {
    // Eigen context: newUserPage blokkeert iubenda net. Het script wordt hier wel opgevraagd,
    // maar niet echt uitgevoerd: de test kijkt na dat het geladen wordt en hoe het ingesteld is.
    const context = await browser.newContext();
    const gevraagd: string[] = [];
    await context.route(/iubenda\.com/, route => {
      gevraagd.push(route.request().url());
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    });
    const page = await context.newPage();
    await page.goto('/');
    await expect.poll(() => gevraagd.some(u => u.endsWith('/cs/iubenda_cs.js'))).toBe(true);
    const config = await page.evaluate(() => (window as any)._iub.csConfiguration);
    expect(config).toMatchObject({
      lang: 'nl',
      siteId: 929007,
      cookiePolicyId: 8245579,
      askConsentAtCookiePolicyUpdate: true,
      banner: { acceptButtonDisplay: true, customizeButtonDisplay: true, listPurposes: true }
    });
    await context.close();
  });
});

test.describe('wachtwoord resetten met de link uit de mail (sc-2004)', () => {
  test('ongeldige link: uitleg en een link om een nieuwe aan te vragen', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    // Echte API: een verzonnen token bestaat niet en geeft 404.
    await page.goto(`/users/resetpassword/bestaat-niet-${Date.now().toString(36)}`);
    await expect(page.locator('ngb-alert')).toContainText('Uw link is ofwel vervallen (= ouder dan 1u) of ongeldig.');
    await expect(page.locator('gimmi-reset-password form')).toHaveCount(0);
    await page.locator('ngb-alert gimmi-forgot-password-link a').click();
    await expect(page).toHaveURL(/\/users\/forgotpassword/);
    await context.close();
  });

  test('geldige link: nieuw wachtwoord kiezen en naar login met het e-mailadres ingevuld', async ({ browser }) => {
    const { context, page } = await newUserPage(browser);
    // Het token uit de mail is alleen in de mail (of de database) te vinden. De API-antwoorden
    // voor dat token worden daarom nagebootst; de echte resetflow zit in de backendtests.
    const token = 'e2e-token-' + Date.now().toString(36);
    let nieuwWachtwoord: string;
    await context.route(new RegExp(`/api/people/account/local/${token}$`), async route => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify({ firstName: 'Smoke', token, expiresOn: new Date(Date.now() + 3600_000) }) });
      }
      nieuwWachtwoord = route.request().postDataJSON().pw;
      return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ email: 'smoke+reset@gimmi.be', usedToken: token }) });
    });

    await page.goto(`/users/resetpassword/${token}`);
    await expect(page.getByRole('heading', { name: 'Vervang je vergeten paswoord' })).toBeVisible();
    const knop = page.getByRole('button', { name: 'Wijzig wachtwoord' });
    await input(page, 'Wachtwoord').fill('Nieuw-geheim-1');
    await input(page, 'Geef wachtwoord nogmaals in').fill('Iets-anders-1');
    await input(page, 'Geef wachtwoord nogmaals in').blur();
    await expect(knop).toBeDisabled();
    await input(page, 'Geef wachtwoord nogmaals in').fill('Nieuw-geheim-1');
    await input(page, 'Geef wachtwoord nogmaals in').blur();
    await knop.click();

    await expect(page).toHaveURL(/\/users\/login\?e=smoke%2Breset(@|%40)gimmi\.be$/);
    await expect(input(page, 'Email (login)')).toHaveValue('smoke+reset@gimmi.be');
    await expect(page.getByText('Wachtwoord aangepast')).toBeVisible();
    expect(nieuwWachtwoord).toBe('Nieuw-geheim-1');
    await context.close();
  });
});
