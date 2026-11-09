// Testgebruikers rechtstreeks in de testdatabase zetten (sc-3283), zonder de UI of een mail. Het document heeft
// de vorm die de backend voor een gewone registratie schrijft, dus v1 en v2 kunnen er allebei mee inloggen.
// Alleen toevoegen; verwijderen gaat via de API (`deleteAccount`), zodat wensen en reserveringen meegaan.
import { MongoClient, ObjectId } from 'mongodb';
import { smokeEmail, smokeLastNames } from './api.ts';

// bcrypt-hash van `smokePassword` (cost 10). Het wachtwoord staat in de repo en geldt alleen op test.
const passwordHash = '$2b$10$dQF8EvURtl6uTw8gH2rNdOCzBNAAHfhNTpXwlCoGkxQ7OI4brrfqG';

export interface SeedAccount { firstName: string; lastName: string; email: string; id?: string; }

async function withDatabase<T>(work: (people: ReturnType<ReturnType<MongoClient['db']>['collection']>) => Promise<T>): Promise<T> {
  const uri = process.env.E2E_DB_URI;
  if (!uri) throw new Error('E2E_DB_URI ontbreekt: de smoketests zetten hun testgebruikers rechtstreeks in de testdatabase.');
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    // Schrijven alleen op een testdatabase; een verkeerd gekopieerde productie-URI stopt hier.
    if (!/test/i.test(db.databaseName) || /prod/i.test(db.databaseName)) {
      throw new Error(`Database "${db.databaseName}" lijkt geen testdatabase: geen "test" in de naam, of "prod" erin.`);
    }
    return await work(db.collection('people'));
  } finally {
    await client.close();
  }
}

/** Zet het account in de testdatabase en vult `id` in. Met E2E_DRY_RUN=1 alleen tonen wat er zou gebeuren. */
export async function seedAccount(account: SeedAccount): Promise<void> {
  if (!smokeEmail.test(account.email) || !smokeLastNames.includes(account.lastName) || account.firstName !== 'Smoke') {
    throw new Error(`Geen smoke-account (naam of adres past niet): ${account.email}`);
  }
  const now = new Date();
  const doc = {
    _id: new ObjectId(),
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email.toLowerCase(),
    birthday: new Date(1990, 4, 17),
    accounts: { local: { password: passwordHash } },
    tokenVersion: 0,
    birthdayVisibility: 'day-month',
    createdAt: now,
    updatedAt: now
  };
  await withDatabase(async people => {
    if (process.env.E2E_DRY_RUN) {
      console.log(`Droog: zou toevoegen ${doc.firstName} ${doc.lastName} <${doc.email}> (${doc._id})`);
    } else {
      await people.insertOne(doc);
    }
  });
  account.id = doc._id.toHexString();
}

/** De smoke-accounts die nog in de testdatabase staan (naam én adres moeten passen). */
export async function findSmokeAccounts(): Promise<{ id: string; email: string }[]> {
  return withDatabase(async people => {
    const docs = await people.find({ firstName: 'Smoke', lastName: { $in: smokeLastNames } }, { projection: { email: 1 } }).toArray();
    return docs.filter(d => smokeEmail.test(String(d['email']))).map(d => ({ id: d._id.toHexString(), email: String(d['email']) }));
  });
}
