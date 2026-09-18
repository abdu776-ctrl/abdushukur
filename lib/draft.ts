'use client';

// Local draft of whatever is open in a builder.
//
// The builders keep their state in React only, so a refresh, a crash, or
// switching language used to throw away everything typed since the last save.
// A draft is written to localStorage as the user types and cleared once the
// document is really saved, so nothing is lost between saves.
//
// This is a safety net, not storage: the account copy in Supabase stays the
// source of truth, and a draft is only restored when it is newer than it.

import type { DocumentKind } from './documents';

const PREFIX = 'koreer:draft';

export interface Draft {
  data: Record<string, unknown>;
  updatedAt: string;
}

/** One draft per document, plus one for the not-yet-saved document. */
export function draftKey(kind: DocumentKind, documentId: string | null): string {
  return `${PREFIX}:${kind}:${documentId ?? 'new'}`;
}

/**
 * Write the draft. Returns false when the browser refused to store it.
 *
 * The caller has to know: this is the net that catches a refresh or a crash,
 * and someone who believes it is there types on for an hour without saving.
 * Out of quota, private mode, or storage switched off — whatever the reason,
 * silence would be the one unacceptable answer.
 */
export function saveDraft(key: string, data: Record<string, unknown>): boolean {
  try {
    const draft: Draft = { data, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function loadDraft(key: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    if (!parsed || typeof parsed !== 'object' || !parsed.data) return null;
    return { data: parsed.data as Record<string, unknown>, updatedAt: parsed.updatedAt ?? '' };
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* nothing to clear */
  }
}

/** True when the draft holds changes made after the document was last saved. */
export function draftIsNewer(draft: Draft | null, savedAt: string | undefined): boolean {
  if (!draft?.updatedAt) return false;
  if (!savedAt) return true;
  return new Date(draft.updatedAt).getTime() > new Date(savedAt).getTime();
}
