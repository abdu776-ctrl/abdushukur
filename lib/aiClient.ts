'use client';

// Client half of the AI guard.
//
// Requests carry the Supabase access token so a signed-in user is recognised
// and gets the larger daily budget — and so /api/tailor, which requires an
// account, works at all. Refusals come back as status codes, which this turns
// into the translated message the user should see.

import { getSupabase } from './supabase';

/** Keys under the `errors` namespace. */
export type AiErrorKey =
  | 'aiSignIn'
  | 'aiQuotaGuest'
  | 'aiQuotaUser'
  | 'aiTooFast'
  | 'aiUnavailable'
  | 'aiTooLong';

async function accessToken(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

/** POST to an AI route with the session attached when there is one. */
export async function aiFetch(url: string, body: unknown): Promise<Response> {
  const token = await accessToken();
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

/**
 * Which message a refusal should produce.
 *
 * @param signedIn changes the wording of a quota refusal: a guest is told
 *                 signing in gets them more, which is true; telling a
 *                 signed-in user the same thing would not be.
 */
export function aiErrorKey(
  status: number,
  signedIn: boolean,
  reason?: string
): AiErrorKey | null {
  if (status === 401) return 'aiSignIn';
  if (status === 413) return 'aiTooLong';
  if (status === 503) return 'aiUnavailable';
  if (status === 429) {
    // A burst refusal clears in a minute; a spent daily budget does not, so
    // the two must not say the same thing.
    if (reason?.includes('too-many-requests')) return 'aiTooFast';
    return signedIn ? 'aiQuotaUser' : 'aiQuotaGuest';
  }
  return null;
}
