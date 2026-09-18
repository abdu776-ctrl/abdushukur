// Career profile — the applicant's real background, entered once and reused
// across every document and every AI request.
//
// This is what turns the AI assist from "answer these questions" into an actual
// tailored draft: /api/tailor is deliberately not allowed to invent facts, so
// it can only write real content when it has this material to work from.
//
// No backend yet, so this persists in localStorage. The shape mirrors a server
// record (updatedAt kept) so it can move to an API later without changing
// callers. Every field is free text — it feeds a language model, not a schema.

export interface CareerProfile {
  headline: string;    // one line: who they are professionally
  skills: string;      // tools, technologies, professional skills
  education: string;   // schools, majors, dates
  experience: string;  // jobs, internships, projects — with real outcomes
  languages: string;   // Korean/TOPIK level, English, others
  strengths: string;   // strengths, achievements, anything notable
  updatedAt: string;   // ISO timestamp
}

const STORAGE_KEY = 'koreer:career-profile';

export function emptyProfile(): CareerProfile {
  return {
    headline: '',
    skills: '',
    education: '',
    experience: '',
    languages: '',
    strengths: '',
    updatedAt: '',
  };
}

export function loadProfile(): CareerProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CareerProfile>;
    return { ...emptyProfile(), ...parsed };
  } catch {
    return null;
  }
}

export function saveProfile(p: CareerProfile): CareerProfile {
  const record = { ...p, updatedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* storage unavailable (private mode) — keep the in-memory copy */
  }
  return record;
}

/** True when there is enough real material for the AI to write from. */
export function hasProfileMaterial(p: CareerProfile | null): boolean {
  if (!p) return false;
  return [p.skills, p.education, p.experience, p.strengths]
    .some((f) => f.trim().length > 0);
}

/**
 * Split the profile's free-text skills field into individual skill names.
 *
 * The field is one box people type into however they like — commas, newlines,
 * bullets, Korean and Chinese punctuation — so the resume's skill list can be
 * built from it without anyone retyping the same words a second time.
 *
 * Nothing is invented here: every name out is a substring of what was typed in.
 */
export function splitSkills(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(/[,;\n\r·•、，；|/]+/)
    .map((s) => s.replace(/^[\s\-*]+/, '').trim())
    .filter((s) => {
      if (s.length === 0 || s.length > 40) return false;
      const key = s.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 20);
}

/** Flatten the profile into the plain-text block sent to the AI as the
 *  applicant's own material. Empty fields are omitted. */
export function profileToPrompt(p: CareerProfile | null): string {
  if (!p) return '';
  const rows: [string, string][] = [
    ['Headline', p.headline],
    ['Skills', p.skills],
    ['Education', p.education],
    ['Experience', p.experience],
    ['Languages', p.languages],
    ['Strengths / achievements', p.strengths],
  ];
  return rows
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v.trim()}`)
    .join('\n');
}
