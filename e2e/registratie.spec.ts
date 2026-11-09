import { test, expect } from '@playwright/test';
import { call, deleteAccount, smokePassword, testMailbox } from './helpers/api';
import { mailConfigured, waitForMail } from './helpers/mail';

// De echte registratie van API v2 in twee stappen (sc-3283): adres opgeven, de link uit de mail halen,
// het account afmaken. Op API-niveau: de UI van de frontend spreekt v2 pas na de omschakeling (fase 7);
// dan komt hier een UI-variant bij. De mail wordt gelezen via de Gmail-API van de testmailbox, een plusadres
// daarvan. Zonder die toegang (E2E_GMAIL_*) wordt de test overgeslagen.
// Het account is een eigen smoke-account en gaat er in afterAll weer af (ook via e2e:cleanup).

test.skip(!mailConfigured, 'E2E_GMAIL_CLIENT_ID, E2E_GMAIL_CLIENT_SECRET en E2E_GMAIL_REFRESH_TOKEN ontbreken');

const runId = `${Date.now().toString(36)}r`;
const email = `${testMailbox}+smoke-${runId}@gmail.com`;
let created = false;

test.afterAll(async () => {
  if (created) await deleteAccount(email, smokePassword);
});

test('registreren in twee stappen met de link uit de mail', async () => {
  await call('POST', 'registrations', undefined, { email });

  const mail = await waitForMail(email);
  const token = mail.match(/\/users\/register\/([A-Za-z0-9_-]+)/)?.[1];
  expect(token, 'registratielink in de mail').toBeTruthy();

  expect(await call('GET', `registrations/${token}`)).toMatchObject({ email });

  const session = await call('PUT', `registrations/${token}`, undefined, {
    firstName: 'Smoke', lastName: 'Nieuweling', password: smokePassword, birthday: '1990-05-17'
  });
  created = true;
  expect(session.tokenType).toBe('Bearer');

  expect(await call('GET', 'me', session.token)).toMatchObject({ email, firstName: 'Smoke', lastName: 'Nieuweling' });

  // De link werkt één keer.
  await expect(call('GET', `registrations/${token}`)).rejects.toThrow(/404/);
});
