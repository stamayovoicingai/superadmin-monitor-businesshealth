/**
 * Homer Next-Gen (v4) REST client. Auth via a long-lived Auth-Token (created under
 * Settings → Auth Tokens in the Homer UI, or POST /auth-tokens) — appropriate for a
 * server-to-server integration, no session/JWT refresh to manage. See PRD/19 §2.1.
 */

function baseUrl(): string {
  const url = process.env.HOMER_BASE_URL;
  if (!url) throw new Error("HOMER_BASE_URL is not set");
  return url.replace(/\/+$/, "");
}

function authToken(): string {
  const token = process.env.HOMER_AUTH_TOKEN;
  if (!token) throw new Error("HOMER_AUTH_TOKEN is not set");
  return token;
}

/** True when both HOMER_BASE_URL and HOMER_AUTH_TOKEN are configured. */
export function isHomerConfigured(): boolean {
  return !!process.env.HOMER_BASE_URL && !!process.env.HOMER_AUTH_TOKEN;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Auth-Token": authToken(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Homer API ${path} → ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

export const homer = {
  get: <T>(path: string): Promise<T> => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown): Promise<T> => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};

/** Fetches a binary export. `pathOrUrl` may be a full URL (from an export's download_url) or a path relative to HOMER_BASE_URL. */
export async function homerGetBinary(pathOrUrl: string): Promise<ArrayBuffer> {
  const url = /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${baseUrl()}${pathOrUrl}`;
  const res = await fetch(url, { headers: { "Auth-Token": authToken() }, cache: "no-store" });
  if (!res.ok) throw new Error(`Homer download ${pathOrUrl} → ${res.status}`);
  return res.arrayBuffer();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
