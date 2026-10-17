'use client';

// Client half of the guard. Same shape as Koreer's, so the voice lab component
// is the same file: what Koreer sends as a session token, this site sends as
// the access code.

import { getCode } from './access';

export type AiErrorKey = 'aiSignIn' | 'aiQuotaGuest' | 'aiQuotaUser' | 'aiTooFast' | 'aiUnavailable' | 'aiTooLong';

/** The access code, sent where Koreer sends a session token. */
export async function accessToken(): Promise<string | null> {
  return getCode() || null;
}

export async function aiFetch(url: string, body: unknown): Promise<Response> {
  const code = getCode();
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(code ? { 'x-access-code': code } : {}) },
    body: JSON.stringify(body),
  });
}

export function aiErrorKey(status: number, signedIn: boolean, reason?: string): AiErrorKey | null {
  if (status === 401) return 'aiSignIn';
  if (status === 413) return 'aiTooLong';
  if (status === 503) return 'aiUnavailable';
  if (status === 429) {
    if (reason?.includes('too-many-requests')) return 'aiTooFast';
    return signedIn ? 'aiQuotaUser' : 'aiQuotaGuest';
  }
  return null;
}
