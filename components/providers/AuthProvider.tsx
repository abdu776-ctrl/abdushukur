'use client';

// Auth state now comes from Supabase via useAuth(), which manages its own
// listener — no session provider is needed. Kept as a passthrough so the root
// layout does not have to change.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
