'use client';

// Server copy of the career profile and the "Why Korea" narrative.
//
// Both live in one `profiles` row (one per user), so they share this module.
// localStorage stays as the offline copy: a signed-out user still gets a
// working profile, and a signed-in user gets the same profile on every device.
//
// Sync rule, deliberately simple: if the server row has any content it wins;
// otherwise whatever is in localStorage is pushed up. That migrates data saved
// before accounts existed without asking the user to do anything.

import { getSupabase } from './supabase';
import { emptyProfile, type CareerProfile } from './profile';
import { emptyNarrative, type WhyKoreaNarrative } from './whyKorea';

export interface ProfileRow {
  headline: string;
  skills: string;
  education: string;
  experience: string;
  languages: string;
  strengths: string;
  arrival_context: string;
  alternatives_weighed: string;
  reason_to_stay: string;
  why_korea_draft: string;
  updated_at: string;
}

const CAREER_COLUMNS = [
  'headline', 'skills', 'education', 'experience', 'languages', 'strengths',
] as const;

const WHY_KOREA_COLUMNS = [
  'arrival_context', 'alternatives_weighed', 'reason_to_stay', 'why_korea_draft',
] as const;

async function currentUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

/** The user's profile row, or null when signed out / not configured / absent. */
export async function fetchProfileRow(): Promise<ProfileRow | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const userId = await currentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('fetch profile failed:', error.message);
    return null;
  }
  return (data as ProfileRow) ?? null;
}

/** Write some columns of the profile row, creating it if needed. */
export async function upsertProfileFields(patch: Partial<ProfileRow>): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const userId = await currentUserId();
  if (!userId) return;

  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });

  if (error) console.error('save profile failed:', error.message);
}

function hasContent(row: ProfileRow | null, columns: readonly (keyof ProfileRow)[]): boolean {
  if (!row) return false;
  return columns.some((c) => String(row[c] ?? '').trim().length > 0);
}

// ── Career profile ──────────────────────────────────────────────────────────

export function rowToProfile(row: ProfileRow): CareerProfile {
  return {
    ...emptyProfile(),
    headline: row.headline ?? '',
    skills: row.skills ?? '',
    education: row.education ?? '',
    experience: row.experience ?? '',
    languages: row.languages ?? '',
    strengths: row.strengths ?? '',
    updatedAt: row.updated_at ?? '',
  };
}

export function profileToRow(p: CareerProfile): Partial<ProfileRow> {
  return {
    headline: p.headline,
    skills: p.skills,
    education: p.education,
    experience: p.experience,
    languages: p.languages,
    strengths: p.strengths,
  };
}

/** Reconcile the local career profile with the server copy. Returns the one to
 *  show, or null to keep what the caller already has. */
export async function syncCareerProfile(local: CareerProfile | null): Promise<CareerProfile | null> {
  const row = await fetchProfileRow();
  if (hasContent(row, CAREER_COLUMNS)) return rowToProfile(row as ProfileRow);
  if (local) await upsertProfileFields(profileToRow(local));
  return null;
}

// ── "Why Korea" narrative ───────────────────────────────────────────────────

export function rowToNarrative(row: ProfileRow): WhyKoreaNarrative {
  return {
    ...emptyNarrative(),
    arrivalContext: row.arrival_context ?? '',
    alternativesWeighed: row.alternatives_weighed ?? '',
    reasonToStay: row.reason_to_stay ?? '',
    draftText: row.why_korea_draft ?? '',
    updatedAt: row.updated_at ?? '',
  };
}

export function narrativeToRow(n: WhyKoreaNarrative): Partial<ProfileRow> {
  return {
    arrival_context: n.arrivalContext,
    alternatives_weighed: n.alternativesWeighed,
    reason_to_stay: n.reasonToStay,
    why_korea_draft: n.draftText,
  };
}

/** Reconcile the local narrative with the server copy. */
export async function syncNarrative(local: WhyKoreaNarrative | null): Promise<WhyKoreaNarrative | null> {
  const row = await fetchProfileRow();
  if (hasContent(row, WHY_KOREA_COLUMNS)) return rowToNarrative(row as ProfileRow);
  if (local) await upsertProfileFields(narrativeToRow(local));
  return null;
}
