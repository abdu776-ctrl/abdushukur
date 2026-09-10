// How complete a résumé is, and what to do next.
//
// The builder gave no sense of progress: nine sections in a scrolling strip,
// nothing showing which were filled or what was still missing. This turns the
// builder state into a percentage and a single next step.

import type {
  PersonalInfo, Education, WorkExperience, Skill,
  Award, Certificate, Project, Volunteer, Publication,
} from '@/types';

export interface ResumeState {
  personal: PersonalInfo;
  education: Education[];
  experience: WorkExperience[];
  skills: Skill[];
  awards: Award[];
  certificates: Certificate[];
  projects: Project[];
  volunteer: Volunteer[];
  publications: Publication[];
}

export type SectionId =
  | 'personal' | 'education' | 'experience' | 'skills'
  | 'awards' | 'certificates' | 'projects' | 'volunteer' | 'publications';

/** Weights reflect what a Korean employer actually expects to see. The extras
 *  together are worth less than experience alone. */
const WEIGHTS: Record<SectionId, number> = {
  personal: 30,
  education: 25,
  experience: 20,
  skills: 15,
  awards: 2,
  certificates: 3,
  projects: 2,
  volunteer: 1,
  publications: 2,
};

/** Order the "next step" hint walks, most important first. */
const PRIORITY: SectionId[] = [
  'personal', 'education', 'experience', 'skills',
  'certificates', 'awards', 'projects', 'publications', 'volunteer',
];

const filled = (v?: string) => Boolean(v && v.trim());

/** How many real entries a section holds. Personal is 0 or 1. */
export function sectionCount(state: ResumeState, id: SectionId): number {
  switch (id) {
    case 'personal':
      return personalComplete(state.personal) ? 1 : 0;
    case 'education':
      return state.education.filter((e) => filled(e.institution)).length;
    case 'experience':
      return state.experience.filter((e) => filled(e.company)).length;
    case 'skills':
      return state.skills.filter((s) => filled(s.name)).length;
    case 'awards':
      return state.awards.filter((a) => filled(a.title)).length;
    case 'certificates':
      return state.certificates.filter((c) => filled(c.name)).length;
    case 'projects':
      return state.projects.filter((p) => filled(p.title)).length;
    case 'volunteer':
      return state.volunteer.filter((v) => filled(v.organization)).length;
    case 'publications':
      return state.publications.filter((p) => filled(p.title)).length;
  }
}

/** Personal counts as done with a name and at least one way to reach them. */
function personalComplete(p: PersonalInfo): boolean {
  return filled(p.fullName) && (filled(p.email) || filled(p.phone));
}

export interface ResumeProgress {
  /** 0–100. */
  percent: number;
  /** The most important section still empty, or null when nothing is missing. */
  nextSection: SectionId | null;
  /** Entry count per section, for the ticks on the section buttons. */
  counts: Record<SectionId, number>;
}

export function resumeProgress(state: ResumeState): ResumeProgress {
  const counts = {} as Record<SectionId, number>;
  let earned = 0;

  for (const id of PRIORITY) {
    const n = sectionCount(state, id);
    counts[id] = n;
    if (n > 0) earned += WEIGHTS[id];
  }

  // Only the four core sections gate the "next step" hint — nobody should be
  // told their résumé is unfinished because they have no volunteer work.
  const nextSection =
    PRIORITY.slice(0, 4).find((id) => counts[id] === 0) ?? null;

  return { percent: Math.min(100, Math.round(earned)), nextSection, counts };
}
