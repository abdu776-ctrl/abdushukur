'use client';

import { useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import {
  isNativeApp,
  isEmbeddedWebView,
  openExternal,
  NATIVE_AUTH_REDIRECT,
} from './native';

// Single source of truth for the session.
//
// Google used to run through NextAuth while email/password ran through
// Supabase, which meant a Google user looked signed in but had no auth.uid()
// — so Row Level Security rejected every save. Both providers now go through
// Supabase, so any signed-in user can read and write their own rows.

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

function mapUser(user: SupabaseUser): AuthUser {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    email: user.email ?? null,
    name:
      (meta.full_name as string) ||
      (meta.name as string) ||
      (user.email ? user.email.split('@')[0] : null),
    image: (meta.avatar_url as string) || (meta.picture as string) || null,
  };
}

export function useAuth(): { user: AuthUser | null; status: AuthStatus } {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ? mapUser(data.session.user) : null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapUser(session.user) : null);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return { user: null, status: 'loading' };
  return { user, status: user ? 'authenticated' : 'unauthenticated' };
}

export type GoogleSignInResult =
  | { ok: true; note?: 'continue-in-browser' }
  | { ok: false; reason: 'not-configured' }
  | { ok: false; reason: 'blocked' }
  | { ok: false; reason: 'error'; message: string };

/**
 * Start the Google flow.
 *
 * Google refuses OAuth inside an embedded WebView, so the route depends on
 * where the page is running:
 *
 *  - Native shell → ask Supabase for the URL without redirecting, open it in
 *    Custom Tabs, and let the deep link bring the session back.
 *  - Someone else's in-app browser (Telegram, Instagram, …) → push the same URL
 *    out to the system browser; the user continues there.
 *  - Ordinary browser → the plain redirect, unchanged.
 */
export async function signInWithGoogle(redirectTo: string): Promise<GoogleSignInResult> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, reason: 'not-configured' };

  const native = isNativeApp();
  const embedded = native || isEmbeddedWebView();

  if (embedded) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: native ? NATIVE_AUTH_REDIRECT : redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error) return { ok: false, reason: 'error', message: error.message };
    if (!data.url) return { ok: false, reason: 'blocked' };

    const opened = await openExternal(data.url);
    if (!opened) return { ok: false, reason: 'blocked' };
    return native ? { ok: true } : { ok: true, note: 'continue-in-browser' };
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  return error ? { ok: false, reason: 'error', message: error.message } : { ok: true };
}

/**
 * Turn the deep link the native shell was reopened with into a real session.
 * Handles both the implicit flow (tokens in the fragment) and PKCE (a code in
 * the query), so it keeps working if the client's flow type changes.
 */
export async function completeNativeSignIn(url: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const accessToken = fragment.get('access_token');
  const refreshToken = fragment.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) console.error('native sign-in failed:', error.message);
    return !error;
  }

  const code = parsed.searchParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error('native sign-in failed:', error.message);
    return !error;
  }

  return false;
}

export async function signOutEverywhere(callbackUrl: string) {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      /* already signed out */
    }
  }
  window.location.href = callbackUrl;
}
