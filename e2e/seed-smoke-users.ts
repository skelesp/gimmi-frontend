// Zet de vaste smoke-accounts (Eigenaar en Gever, zie helpers/api.ts) eenmalig in de testdatabase (sc-3283).
// Draait alleen op een database met "test" in de naam; bestaat een account al, dan wordt het opnieuw gezet.
//
//   E2E_DB_URI="<verbinding met testdatabase>" npm run e2e:seed      (E2E_DRY_RUN=1: alleen tonen)
//
// Het document heeft de vorm die de backend voor een gewone registratie schrijft, dus v1 en v2 loggen er allebei mee in.
import { MongoClient, ObjectId } from 'mongodb';
import { smokeAccounts, smokeEmail } from './helpers/api.ts';

// bcrypt-hash van `smokePassword` (cost 10).
const passwordHash = '$2b$10$dQF8EvURtl6uTw8gH2rNdOCzBNAAHfhNTpXwlCoGkxQ7OI4brrfqG';

async function main(): Promise<void> {
  const uri = process.env.E2E_DB_URI;
  if (!uri) throw new Error('E2E_DB_URI ontbreekt.');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    if (!/test/i.test(db.databaseName) || /prod/i.test(db.databaseName)) {
      throw new Error(`Database "${db.databaseName}" lijkt geen testdatabase: geen "test" in de naam, of "prod" erin.`);
    }
    console.log(`Database: ${db.databaseName}`);
    const now = new Date();
    for (const account of Object.values(smokeAccounts)) {
      if (!smokeEmail.test(account.email)) throw new Error(`Geen smoke-adres: ${account.email}`);
      const doc = {
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        birthday: new Date(1990, 4, 17),
        accounts: { local: { password: passwordHash } },
        tokenVersion: 0,
        birthdayVisibility: 'day-month',
        createdAt: now,
        updatedAt: now
      };
      if (process.env.E2E_DRY_RUN) {
        console.log(`Droog: zou zetten ${doc.firstName} ${doc.lastName} <${doc.email}> (${account.id})`);
      } else {
        await db.collection('people').replaceOne({ _id: new ObjectId(account.id) }, doc, { upsert: true });
        console.log(`Gezet: ${doc.firstName} ${doc.lastName} <${doc.email}> (${account.id})`);
      }
    }
  } finally {
    await client.close();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
