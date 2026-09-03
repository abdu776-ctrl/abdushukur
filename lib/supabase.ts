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
