// Rechtstreekse aanroepen van API v2 voor de opruiming van testdata en de registratietest. De tests zelf gaan via de UI.

// Gedeelde testomgeving; overschrijfbaar met E2E_API_URL (basis van v2, met /api/v2/).
export const apiUrl = (process.env.E2E_API_URL || 'https://api-test.gimmi.be/api/v2/').replace(/\/?$/, '/');

export const smokePassword = 'Smoke-test-1!';

// Alleen accounts met dit adres en deze naam mogen door de opruiming verwijderd worden. De registratietest
// gebruikt een plusadres van de testmailbox, omdat de mail daar via de Gmail-API gelezen wordt.
export const testMailbox = 'gimmi.theperfectgift';
export const smokeEmail = new RegExp(`^(smoke\\+[a-z]+-[a-z0-9]+@gimmi\\.be|${testMailbox}\\+smoke-[a-z0-9]+@gmail\\.com)$`);
export const smokeLastNames = ['Eigenaar', 'Gever', 'Opruimer', 'Nieuweling'];

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

/** Verwijdert het account (met de wensen ervan) via de API: inloggen levert een vers token, en dat vraagt `DELETE /me`. */
export async function deleteAccount(email: string, password: string): Promise<void> {
  await call('DELETE', 'me', await login(email, password));
}
