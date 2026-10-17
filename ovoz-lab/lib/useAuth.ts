'use client';

// No accounts on this site: the access code stands in for signing in, so to
// the voice lab everyone here is "signed in".

export function useAuth(): { user: null; status: 'authenticated' } {
  return { user: null, status: 'authenticated' };
}
