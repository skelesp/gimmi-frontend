// Rechtstreekse API-aanroepen voor de opruiming van testdata. De tests zelf gaan via de UI.

// Gedeelde testomgeving; overschrijfbaar als E2E_BASE_URL naar een andere omgeving wijst.
export const apiUrl = (process.env.E2E_API_URL || 'https://api-test.gimmi.be/api/').replace(/\/?$/, '/');

export const smokePassword = 'Smoke-test-1!';

// Alleen accounts met dit adres en deze naam mogen door de opruiming verwijderd worden.
export const smokeEmail = /^smoke\+[a-z]+-[a-z0-9]+@gimmi\.be$/;
export const smokeLastNames = ['Eigenaar', 'Gever', 'Opruimer'];

async function call(method: string, path: string, token?: string, body?: unknown): Promise<any> {
  const res = await fetch(apiUrl + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

export async function login(email: string, password: string): Promise<string> {
  return (await call('POST', 'authenticate', undefined, { account: 'local', email, password })).token;
}

/** Verwijdert het account (en de wensen ervan) via de API, ingelogd als die gebruiker zelf. */
export async function deleteAccount(id: string, email: string, password: string): Promise<{ deletedWishes: number; removedReservations: number }> {
  return call('DELETE', `people/${id}`, await login(email, password));
}

export async function register(firstName: string, lastName: string, email: string, password: string): Promise<{ id: string; token: string }> {
  const res = await call('POST', 'people', undefined, { firstname: firstName, lastname: lastName, email, password });
  return { id: JSON.parse(Buffer.from(res.token.split('.')[1], 'base64url').toString())._id, token: res.token };
}

export async function listPeople(): Promise<{ _id: string; firstName: string; lastName: string }[]> {
  return call('GET', 'people');
}

export async function emailOf(id: string, token: string): Promise<string> {
  return call('GET', `people/${id}/email`, token);
}
