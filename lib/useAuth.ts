'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

// Unified session across both auth systems.
//
// Google sign-in still runs through NextAuth, while email/password now runs
// through Supabase (which also gives us the auth.uid() that Row Level Security
// checks). Rather than rip NextAuth out in one risky step, every consumer reads
// the session through this hook, so either provider signs a user in and the UI
// stays consistent.

export interface AuthUser {
  id: string | null;
  email: string | null;
  name: string | null;
  image: string | null;
  /** Which provider the session came from — Supabase sessions can talk to the DB. */
  provider: 'supabase' | 'nextauth';
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

function mapSupabaseUser(user: SupabaseUser): AuthUser {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    id: user.id,
    email: user.email ?? null,
    name: (meta.full_name as string) || (meta.name as string) || null,
    image: (meta.avatar_url as string) || null,
    provider: 'supabase',
  };
}

export function useAuth(): { user: AuthUser | null; status: AuthStatus } {
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const [supabaseUser, setSupabaseUser] = useState<AuthUser | null>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setSupabaseLoading(false);
      return;
    }
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSupabaseUser(data.session?.user ? mapSupabaseUser(data.session.user) : null);
      setSupabaseLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseUser(session?.user ? mapSupabaseUser(session.user) : null);
      setSupabaseLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (supabaseUser) return { user: supabaseUser, status: 'authenticated' };

  if (nextAuthStatus === 'authenticated' && nextAuthSession?.user) {
    const u = nextAuthSession.user;
    return {
      user: {
        id: null,
        email: u.email ?? null,
        name: u.name ?? null,
        image: u.image ?? null,
        provider: 'nextauth',
      },
      status: 'authenticated',
    };
  }

  if (supabaseLoading || nextAuthStatus === 'loading') {
    return { user: null, status: 'loading' };
  }

  return { user: null, status: 'unauthenticated' };
}

/** Sign out of whichever provider is active — NextAuth redirects, so Supabase
 *  is cleared first. */
export async function signOutEverywhere(callbackUrl: string) {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      /* already signed out */
    }
  }
  await nextAuthSignOut({ callbackUrl });
}
