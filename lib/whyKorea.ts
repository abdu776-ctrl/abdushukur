// "Why Korea" narrative — a foreign applicant's reusable answer to the question
// Korean-national tools never ask. Stored at the PROFILE level (once), reused
// across every 자소서.
//
// There is no backend yet, so this persists in localStorage. The shape mirrors
// a server record (updatedAt kept) so it can be moved to an API later without
// changing callers. `id`/`userId` are intentionally omitted until real accounts
// back it — they cannot be honoured client-side.

export interface WhyKoreaNarrative {
  arrivalContext: string;      // when and why they first came to Korea
  alternativesWeighed: string; // what other country or path they considered
  reasonToStay: string;        // what made them build a career here
  draftText: string;           // user-edited 2–3 sentence version
  updatedAt: string;           // ISO timestamp
}

const STORAGE_KEY = 'koreer:why-korea';

export function emptyNarrative(): WhyKoreaNarrative {
  return { arrivalContext: '', alternativesWeighed: '', reasonToStay: '', draftText: '', updatedAt: '' };
}

export function loadNarrative(): WhyKoreaNarrative | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WhyKoreaNarrative>;
    return { ...emptyNarrative(), ...parsed };
  } catch {
    return null;
  }
}

export function saveNarrative(n: WhyKoreaNarrative): WhyKoreaNarrative {
  const record = { ...n, updatedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* storage unavailable (private mode) — keep the in-memory copy */
  }
  return record;
}

/** True when there is a usable closing paragraph to insert. */
export function hasNarrativeDraft(n: WhyKoreaNarrative | null): boolean {
  return !!n && n.draftText.trim().length > 0;
}

/** Stitch the three answers into a first draft — the user's own words only,
 *  never invented. Returns '' if all three are empty. */
export function composeDraft(n: WhyKoreaNarrative): string {
  return [n.arrivalContext, n.reasonToStay, n.alternativesWeighed]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' ');
}
