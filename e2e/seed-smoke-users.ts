// Sets up the fixed smoke accounts (owner and giver, see helpers/api.ts) once in the test database (sc-3283).
// Only runs on a database with "test" in its name; if an account already exists, it is set again.
//
//   E2E_DB_URI="<connection to test database>" npm run e2e:seed      (E2E_DRY_RUN=1: only show)
//
// The document has the shape the backend writes for a regular registration, so both v1 and v2 log in with it.
import { MongoClient, ObjectId } from 'mongodb';
import { smokeAccounts, smokeEmail } from './helpers/api.ts';

// bcrypt-hash van `smokePassword` (cost 10).
const passwordHash = '$2b$10$dQF8EvURtl6uTw8gH2rNdOCzBNAAHfhNTpXwlCoGkxQ7OI4brrfqG';

async function main(): Promise<void> {
  const uri = process.env.E2E_DB_URI;
  if (!uri) throw new Error('E2E_DB_URI is missing.');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    if (!/test/i.test(db.databaseName) || /prod/i.test(db.databaseName)) {
      throw new Error(`Database "${db.databaseName}" does not look like a test database: no "test" in the name, or "prod" in it.`);
    }
    console.log(`Database: ${db.databaseName}`);
    const now = new Date();
    for (const account of Object.values(smokeAccounts)) {
      if (!smokeEmail.test(account.email)) throw new Error(`Not a smoke address: ${account.email}`);
      const doc = {
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        birthday: new Date(1990, 4, 17),
        likes: [],
        dislikes: [],
        accounts: { local: { password: passwordHash } },
        tokenVersion: 0,
        birthdayVisibility: 'day-month',
        createdAt: now,
        updatedAt: now
      };
      if (process.env.E2E_DRY_RUN) {
        console.log(`Dry run: would set ${doc.firstName} ${doc.lastName} <${doc.email}> (${account.id})`);
      } else {
        await db.collection('people').replaceOne({ _id: new ObjectId(account.id) }, doc, { upsert: true });
        console.log(`Set: ${doc.firstName} ${doc.lastName} <${doc.email}> (${account.id})`);
      }
    }
  } finally {
    await client.close();
  }
}

main().catch(err => { console.error(err); process.exit(1); });
