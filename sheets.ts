/**
 * Google Sheets access without the Node `googleapis` SDK (not Workers-compatible).
 * Signs a service-account JWT with WebCrypto, exchanges it for an access token,
 * then calls the Sheets REST API directly.
 */

export const EVENTS_SHEET_ID = "1mM9oMa96aVwNz8wS7aEREz1_EzUJqDMxuvDoSf0poT8";
const SHEETS_BASE = `https://sheets.googleapis.com/v4/spreadsheets/${EVENTS_SHEET_ID}`;
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export const quoteTab = (tab: string) => `'${tab.replace(/'/g, "''")}'`;

const b64url = (input: ArrayBuffer | string) => {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

function pemToDer(pem: string): ArrayBuffer {
  const clean = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(clean);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

/** Returns a short-lived OAuth access token for the service account. */
export async function getSheetsAccessToken(clientEmail: string, privateKeyRaw: string): Promise<string> {
  if (!clientEmail || !privateKeyRaw) throw new Error("Google client credentials are missing.");

  // Accept keys stored with literal "\n" sequences (as in the original .env).
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  );
  const unsigned = `${header}.${claims}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${b64url(sig)}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function sheetsFetch(token: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`${SHEETS_BASE}${path}`, {
    ...init,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Sheets ${init.method ?? "GET"} ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Creates the tab if missing, then rewrites the header row on every submission. */
export async function ensureOriginsTabExists(token: string, sheetTab: string, columns: readonly string[]) {
  const meta = (await sheetsFetch(token, "?fields=sheets.properties.title")) as {
    sheets?: { properties?: { title?: string } }[];
  };
  const hasTab = meta.sheets?.some((s) => s.properties?.title === sheetTab);

  if (!hasTab) {
    await sheetsFetch(token, ":batchUpdate", {
      method: "POST",
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: sheetTab } } }] }),
    });
  }

  // Clear the whole header row first so old column names from a previous layout
  // do not linger past the new last column, then write the current headers.
  const clearRange = encodeURIComponent(`${quoteTab(sheetTab)}!A1:Z1`);
  await sheetsFetch(token, `/values/${clearRange}:clear`, { method: "POST", body: "{}" });

  const lastCol = String.fromCharCode("A".charCodeAt(0) + columns.length - 1);
  const writeRange = encodeURIComponent(`${quoteTab(sheetTab)}!A1:${lastCol}1`);
  await sheetsFetch(token, `/values/${writeRange}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [[...columns]] }),
  });
}

export async function appendRow(token: string, a1Range: string, row: (string | number)[]) {
  const range = encodeURIComponent(a1Range);
  await sheetsFetch(
    token,
    `/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: "POST", body: JSON.stringify({ values: [row] }) },
  );
}
