// Leest mail uit de testmailbox via de Gmail-API (alleen-lezen), voor de registratietest (sc-3283).
// Geen SDK: een refresh-token wisselt tegen een access-token, daarna twee GET's.

export const mailConfigured = Boolean(process.env.E2E_GMAIL_CLIENT_ID && process.env.E2E_GMAIL_CLIENT_SECRET && process.env.E2E_GMAIL_REFRESH_TOKEN);

async function accessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.E2E_GMAIL_CLIENT_ID!,
      client_secret: process.env.E2E_GMAIL_CLIENT_SECRET!,
      refresh_token: process.env.E2E_GMAIL_REFRESH_TOKEN!,
      grant_type: 'refresh_token'
    })
  });
  if (!res.ok) throw new Error(`Gmail-token ophalen mislukt: ${res.status}`);
  return (await res.json()).access_token;
}

interface Part { mimeType?: string; body?: { data?: string }; parts?: Part[]; }

function textOf(part: Part): string {
  const own = part.body?.data ? Buffer.from(part.body.data, 'base64url').toString('utf8') : '';
  return own + (part.parts ?? []).map(textOf).join('\n');
}

/** Wacht tot er een mail voor dit adres is en geeft de tekst ervan (html en platte tekst samen). */
export async function waitForMail(to: string, timeoutMs = 90_000): Promise<string> {
  const token = await accessToken();
  const headers = { authorization: `Bearer ${token}` };
  const api = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const list = await fetch(`${api}?${new URLSearchParams({ q: `to:${to} newer_than:1d`, maxResults: '1' })}`, { headers });
    if (!list.ok) throw new Error(`Gmail zoeken mislukt: ${list.status}`);
    const id = (await list.json()).messages?.[0]?.id;
    if (id) {
      const message = await fetch(`${api}/${id}?format=full`, { headers });
      if (!message.ok) throw new Error(`Gmail lezen mislukt: ${message.status}`);
      return textOf((await message.json()).payload);
    }
    await new Promise(resolve => setTimeout(resolve, 3_000));
  }
  throw new Error(`Geen mail voor ${to} binnen ${timeoutMs / 1000} seconden`);
}
