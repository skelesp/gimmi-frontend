// Cleans up the test data of the smoke tests in the test environment (sc-3283). Safety net for runs that stopped halfway.
//
//   npm run e2e:cleanup
//
// Via API v2, with the known password of the smoke accounts: the fixed accounts (owner, giver) keep their
// account but lose their wishes; the throwaway account of core-flows test 1 is removed. Real users
// are never touched: only these addresses are involved.
import { apiUrl, clearWishes, newcomerEmail, removeAccount, smokeAccounts } from './helpers/api.ts';

async function main(): Promise<void> {
  console.log(`Cleaning up against ${apiUrl}`);
  for (const account of Object.values(smokeAccounts)) {
    console.log(`${account.email}: ${await clearWishes(account)} wishes removed`);
  }
  await removeAccount(newcomerEmail);
  console.log(`${newcomerEmail}: removed if it existed`);
}

main().catch(err => { console.error(err); process.exit(1); });
