// Ruimt de testdata van de smoketests op in de testomgeving (sc-3283). Vangnet voor runs die halverwege stopten.
//
//   npm run e2e:cleanup
//
// Via API v2, met het bekende wachtwoord van de smoke-accounts: de vaste accounts (Eigenaar, Gever) houden hun
// account maar verliezen hun wensen; het wegwerpaccount van kernflows test 1 wordt verwijderd. Echte gebruikers
// worden nooit geraakt: alleen deze adressen komen aan bod.
import { apiUrl, clearWishes, newcomerEmail, removeAccount, smokeAccounts } from './helpers/api.ts';

async function main(): Promise<void> {
  console.log(`Opruimen tegen ${apiUrl}`);
  for (const account of Object.values(smokeAccounts)) {
    console.log(`${account.email}: ${await clearWishes(account)} wensen verwijderd`);
  }
  await removeAccount(newcomerEmail);
  console.log(`${newcomerEmail}: verwijderd als het bestond`);
}

main().catch(err => { console.error(err); process.exit(1); });
