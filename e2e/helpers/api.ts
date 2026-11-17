// Direct calls to API v2 for the test data of the smoke tests. The tests themselves go through the UI.

// Shared test environment; overridable with E2E_API_URL (base of v2, with /api/v2/).
export const apiUrl = (process.env.E2E_API_URL || 'https://api-test.gimmi.be/api/v2/').replace(/\/?$/, '/');

export const smokePassword = 'Smoke-test-1!';

// Only accounts with this address and name may be touched by the scripts.
export const smokeEmail = /^smoke\+[a-z]+-[a-z0-9]+@gimmi\.be$/;

export interface SmokeAccount { firstName: string; lastName: string; email: string; password: string; id: string; }

// Fixed accounts (sc-3283): set up once in the test database with `npm run e2e:seed`. The specs log in with them
// and only clean up the wishes. Password and ids are in the repo and only apply on test.
export const smokeAccounts: Record<'owner' | 'giver', SmokeAccount> = {
  owner: { firstName: 'Smoke', lastName: 'Eigenaar', email: 'smoke+owner-vast@gimmi.be', password: smokePassword, id: '5e2e00000000000000000001' },
  giver: { firstName: 'Smoke', lastName: 'Gever', email: 'smoke+giver-vast@gimmi.be', password: smokePassword, id: '5e2e00000000000000000002' }
};

// The account that test 1 of core-flows registers in the UI; it is removed before and after the run.
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

/** Removes all wishes of the account (including the reservations and ideas of others on them). Returns the count. */
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

/** Removes a throwaway account (with its wishes) via `DELETE /me`; if it does not exist, nothing happens. */
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
