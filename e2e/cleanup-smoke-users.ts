// Ruimt smoke-testgebruikers (en hun wensen) op in de testomgeving. Vangnet voor
// runs die halverwege stopten.
//
//   npm run e2e:cleanup              (E2E_DRY_RUN=1: alleen tonen wat er verwijderd wordt)
//
// De kandidaten komen uit de testdatabase (E2E_DB_URI): naam Smoke + Eigenaar/Gever/Opruimer/Nieuweling én een
// adres dat bij een smoke-account past. Verwijderen gaat via API v2: de gebruikers hebben een bekend
// wachtwoord, dus het script logt in als elke gebruiker en roept `DELETE /me` aan. Echte gebruikers
// worden dus nooit geraakt.
import { apiUrl, deleteAccount, smokePassword } from './helpers/api.ts';
import { findSmokeAccounts } from './helpers/seed.ts';

async function main(): Promise<void> {
  console.log(`Opruimen tegen ${apiUrl}`);
  const kandidaten = await findSmokeAccounts();
  if (kandidaten.length === 0) {
    console.log('Geen smoke-gebruikers gevonden.');
    return;
  }

  let verwijderd = 0, mislukt = 0;
  for (const { id, email } of kandidaten) {
    if (process.env.E2E_DRY_RUN) {
      console.log(`Droog: zou verwijderen ${email} (${id})`);
      continue;
    }
    try {
      await deleteAccount(email, smokePassword);
      verwijderd++;
    } catch (err) {
      console.log(`Mislukt voor ${email}: ${(err as Error).message}`);
      mislukt++;
    }
  }
  console.log(`Klaar: ${verwijderd} gebruikers verwijderd, ${mislukt} mislukt.`);
  if (mislukt) process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });
