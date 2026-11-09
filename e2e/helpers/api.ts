// Rechtstreekse aanroepen van API v2 voor de testdata van de smoketests. De tests zelf gaan via de UI.

// Gedeelde testomgeving; overschrijfbaar met E2E_API_URL (basis van v2, met /api/v2/).
export const apiUrl = (process.env.E2E_API_URL || 'https://api-test.gimmi.be/api/v2/').replace(/\/?$/, '/');

export const smokePassword = 'Smoke-test-1!';

// Alleen accounts met dit adres en deze naam mogen door de scripts aangeraakt worden.
export const smokeEmail = /^smoke\+[a-z]+-[a-z0-9]+@gimmi\.be$/;

export interface SmokeAccount { firstName: string; lastName: string; email: string; password: string; id: string; }

// Vaste accounts (sc-3283): eenmalig in de testdatabase gezet met `npm run e2e:seed`. De specs loggen erin
// en ruimen alleen de wensen op. Wachtwoord en id's staan in de repo en gelden alleen op test.
export const smokeAccounts: Record<'owner' | 'giver', SmokeAccount> = {
  owner: { firstName: 'Smoke', lastName: 'Eigenaar', email: 'smoke+owner-vast@gimmi.be', password: smokePassword, id: '5e2e00000000000000000001' },
  giver: { firstName: 'Smoke', lastName: 'Gever', email: 'smoke+giver-vast@gimmi.be', password: smokePassword, id: '5e2e00000000000000000002' }
};

// Het account dat test 1 van kernflows in de UI registreert; het wordt voor en na de run verwijderd.
export const newcomerEmail = 'smoke+newcomer-vast@gimmi.be';

export async function call(method: string, path: string, token?: string, body?: unknown): Promise<any> {
  const res = await fetch(apiUrl + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

export async function login(email: string, password: string): Promise<string> {
  return (await call('POST', 'auth/token', undefined, { email, password })).token;
}

/** Verwijdert alle wensen van het account (ook de reserveringen en ideeën van anderen erop). Geeft het aantal terug. */
export async function clearWishes(account: SmokeAccount): Promise<number> {
  const token = await login(account.email, account.password);
  const ids: string[] = [];
  let cursor: string | null = null;
  do {
    const query: string = new URLSearchParams({ limit: '100', ...(cursor ? { cursor } : {}) }).toString();
    const page: { items: { id: string }[]; nextCursor: string | null } = await call('GET', `people/${account.id}/wishes?${query}`, token);
    ids.push(...page.items.map(wish => wish.id));
    cursor = page.nextCursor;
  } while (cursor);
  for (const id of ids) await call('DELETE', `wishes/${id}`, token);
  return ids.length;
}

/** Verwijdert een wegwerpaccount (met zijn wensen) via `DELETE /me`; bestaat het niet, dan gebeurt er niets. */
export async function removeAccount(email: string, password = smokePassword): Promise<void> {
  let token: string;
  try {
    token = await login(email, password);
  } catch (err) {
    if (/ 401 /.test((err as Error).message)) return;
    throw err;
  }
  await call('DELETE', 'me', token);
}
