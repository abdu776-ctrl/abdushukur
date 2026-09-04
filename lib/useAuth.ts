'use client';

import { useEffect, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

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

/** Start the Google flow. Supabase sends the user to Google and back to
 *  `redirectTo`, arriving with a real Supabase session — so saving works. */
export async function signInWithGoogle(redirectTo: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return 'not-configured';
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  return error ? error.message : null;
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
