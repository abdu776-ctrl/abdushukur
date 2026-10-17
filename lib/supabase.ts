'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Browser Supabase client.
//
// The publishable (anon) key is designed to ship to the browser — it is not a
// secret. Every table is protected by Row Level Security instead, so a user can
// only ever read or write their own rows. The service_role key must never
// appear in this codebase.
//
// Both values come from the environment; nothing is hardcoded.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** Returns the shared client, or null when Supabase is not configured yet —
 *  callers fall back to local-only behaviour so the app never hard-fails. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

/** True when the environment variables are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

/**
 * Can the Supabase project actually be reached right now?
 *
 * Configured is not the same as alive. A free project pauses itself after a
 * week of low activity, and a paused or removed one stops answering — its
 * hostname may not even resolve. Most calls surface that as a failed request we
 * can translate, but the Google button is different: signInWithOAuth only
 * builds a URL and navigates, so a dead project hands the person to the
 * browser's own error page, in English, with a hostname and no explanation.
 *
 * Short timeout on purpose: this sits in front of a button press, and a slow
 * answer here is worse than an optimistic one.
 */
export async function supabaseReachable(): Promise<boolean> {
  if (!url || !anonKey) return false;
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: anonKey },
      signal: AbortSignal.timeout(6000),
    });
    return res.ok;
  } catch {
    // DNS failure, timeout, offline, CORS — all mean the same thing to the
    // person standing in front of the button.
    return false;
  }
}
