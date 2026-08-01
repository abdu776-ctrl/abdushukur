// Structured writing guidance for the 자기소개서 builder.
//
// Rules are DATA, not JSX, so they can be translated (titleKey/bodyKey point at
// i18n keys under `coverLetter`) and extended without touching components.
//
// Real rule text is provided separately; the entries below are placeholder
// scaffolding so the panel + intro can be verified end to end.

// The section types the builder uses, plus 'general' for the intro's
// cross-cutting principles. Kept here so it is the single source of truth.
export type CoverLetterSectionType =
  | 'growth'
  | 'personality'
  | 'motivation'
  | 'aspiration'
  | 'custom';

export type GuidanceSectionType = CoverLetterSectionType | 'general';

export type GuidanceKind = 'formula' | 'mistake' | 'tip' | 'checklist' | 'example';

export interface GuidanceRule {
  id: string;
  sectionType: GuidanceSectionType;
  kind: GuidanceKind;
  /** i18n key under `coverLetter` for the short label. */
  titleKey: string;
  /** i18n key under `coverLetter` for the body text. */
  bodyKey: string;
  order: number;
}

export const GUIDANCE_RULES: GuidanceRule[] = [
  // ── General core principles (shown in the "Before you write" intro) ──
  { id: 'core-honesty',  sectionType: 'general', kind: 'tip', titleKey: 'rules.core-honesty.title',  bodyKey: 'rules.core-honesty.body',  order: 1 },
  { id: 'core-specific', sectionType: 'general', kind: 'tip', titleKey: 'rules.core-specific.title', bodyKey: 'rules.core-specific.body', order: 2 },

  // ── 성장과정 / growth ──
  { id: 'growth-formula',   sectionType: 'growth', kind: 'formula',   titleKey: 'rules.growth-formula.title',   bodyKey: 'rules.growth-formula.body',   order: 1 },
  { id: 'growth-checklist', sectionType: 'growth', kind: 'checklist', titleKey: 'rules.growth-checklist.title', bodyKey: 'rules.growth-checklist.body', order: 2 },

  // ── 성격 / personality ──
  { id: 'personality-example', sectionType: 'personality', kind: 'example', titleKey: 'rules.personality-example.title', bodyKey: 'rules.personality-example.body', order: 1 },

  // ── 지원동기 / motivation ──
  { id: 'motivation-mistake', sectionType: 'motivation', kind: 'mistake', titleKey: 'rules.motivation-mistake.title', bodyKey: 'rules.motivation-mistake.body', order: 1 },
];

/** Rules that apply to a section, sorted by order. Custom sections fall back to
 *  the general principles so the panel is never empty. */
export function rulesForSection(type: GuidanceSectionType): GuidanceRule[] {
  const list = GUIDANCE_RULES.filter((r) => r.sectionType === type);
  const effective = list.length === 0 && type === 'custom'
    ? GUIDANCE_RULES.filter((r) => r.sectionType === 'general')
    : list;
  return [...effective].sort((a, b) => a.order - b.order);
}

/** The cross-cutting principles shown in the first-time intro. */
export function generalRules(): GuidanceRule[] {
  return GUIDANCE_RULES.filter((r) => r.sectionType === 'general').sort((a, b) => a.order - b.order);
}
