// Resume template model — LAYOUT and COLOUR THEME are independent.
//
// A document is described by { layoutId, themeId }. The layout decides the
// structure (columns, photo slot, section styling); the theme decides only the
// accent colour. Changing one never changes the other.
//
// The 25 legacy single-string template ids collapse into these layouts + themes
// via LEGACY_TEMPLATE_MAP, so older values keep rendering correctly.

export type LayoutId =
  | 'modern'
  | 'korean'
  | 'korean-nophoto'
  | 'classic'
  | 'minimal'
  | 'sidebar'
  | 'dark'
  | 'tech'
  | 'academic'
  | 'compact';

export type ThemeId =
  | 'indigo'
  | 'navy'
  | 'forest'
  | 'crimson'
  | 'teal'
  | 'amber'
  | 'rose'
  | 'slate';

export interface LayoutMeta {
  id: LayoutId;
  /** i18n key under resume.templates.layout.<id>.name / .desc */
  nameKey: string;
  descKey: string;
  columns: 1 | 2;
  hasPhotoSlot: boolean;
}

export interface Theme {
  id: ThemeId;
  /** i18n key under resume.templates.color.<id> */
  nameKey: string;
  accent: string;
  /** Soft tint of the accent, used for section rules / table headers. */
  light: string;
  /** Header gradient for layouts that use a colour band. */
  gradient: string;
}

export const LAYOUTS: LayoutMeta[] = [
  { id: 'korean',         nameKey: 'korean',        descKey: 'korean',        columns: 1, hasPhotoSlot: true },
  { id: 'korean-nophoto', nameKey: 'korean-nophoto',descKey: 'korean-nophoto',columns: 1, hasPhotoSlot: false },
  { id: 'modern',         nameKey: 'modern',        descKey: 'modern',        columns: 2, hasPhotoSlot: true },
  { id: 'classic',        nameKey: 'classic',       descKey: 'classic',       columns: 1, hasPhotoSlot: false },
  { id: 'minimal',        nameKey: 'minimal',       descKey: 'minimal',       columns: 1, hasPhotoSlot: false },
  { id: 'sidebar',        nameKey: 'sidebar',       descKey: 'sidebar',       columns: 2, hasPhotoSlot: true },
  { id: 'compact',        nameKey: 'compact',       descKey: 'compact',       columns: 2, hasPhotoSlot: false },
  { id: 'academic',       nameKey: 'academic',      descKey: 'academic',      columns: 1, hasPhotoSlot: false },
  { id: 'tech',           nameKey: 'tech',          descKey: 'tech',          columns: 1, hasPhotoSlot: false },
  { id: 'dark',           nameKey: 'dark',          descKey: 'dark',          columns: 1, hasPhotoSlot: true },
];

export const THEMES: Theme[] = [
  { id: 'indigo',  nameKey: 'indigo',  accent: '#4f46e5', light: '#eef2ff', gradient: 'linear-gradient(135deg,#4f46e5 0%,#9333ea 100%)' },
  { id: 'navy',    nameKey: 'navy',    accent: '#1d4ed8', light: '#eff6ff', gradient: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)' },
  { id: 'forest',  nameKey: 'forest',  accent: '#15803d', light: '#f0fdf4', gradient: 'linear-gradient(135deg,#14532d 0%,#16a34a 100%)' },
  { id: 'teal',    nameKey: 'teal',    accent: '#0d9488', light: '#f0fdfa', gradient: 'linear-gradient(135deg,#134e4a 0%,#0d9488 100%)' },
  { id: 'crimson', nameKey: 'crimson', accent: '#dc2626', light: '#fef2f2', gradient: 'linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%)' },
  { id: 'amber',   nameKey: 'amber',   accent: '#b45309', light: '#fffbeb', gradient: 'linear-gradient(135deg,#78350f 0%,#d97706 100%)' },
  { id: 'rose',    nameKey: 'rose',    accent: '#e11d48', light: '#fff1f2', gradient: 'linear-gradient(135deg,#881337 0%,#e11d48 100%)' },
  { id: 'slate',   nameKey: 'slate',   accent: '#334155', light: '#f8fafc', gradient: 'linear-gradient(135deg,#1f2937 0%,#334155 100%)' },
];

export const DEFAULT_LAYOUT: LayoutId = 'korean';
export const DEFAULT_THEME: ThemeId = 'slate';

export function getTheme(id: ThemeId | string | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function getLayout(id: LayoutId | string | undefined): LayoutMeta {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

// Legacy: map each of the 25 old single-string template ids to { layoutId,
// themeId } so previously-chosen values still resolve.
export const LEGACY_TEMPLATE_MAP: Record<string, { layoutId: LayoutId; themeId: ThemeId }> = {
  // Modern colour series → one layout, eight colours
  modern:   { layoutId: 'modern', themeId: 'indigo' },
  navy:     { layoutId: 'modern', themeId: 'navy' },
  forest:   { layoutId: 'modern', themeId: 'forest' },
  crimson:  { layoutId: 'modern', themeId: 'crimson' },
  teal:     { layoutId: 'modern', themeId: 'teal' },
  amber:    { layoutId: 'modern', themeId: 'amber' },
  midnight: { layoutId: 'modern', themeId: 'indigo' },
  rose:     { layoutId: 'modern', themeId: 'rose' },
  // Korean official series
  korean:          { layoutId: 'korean',         themeId: 'slate' },
  'korean-blue':   { layoutId: 'korean',         themeId: 'navy' },
  'korean-compact':{ layoutId: 'korean-nophoto', themeId: 'slate' },
  'korean-premium':{ layoutId: 'korean',         themeId: 'indigo' },
  // Classic series
  classic:   { layoutId: 'classic', themeId: 'slate' },
  oxford:    { layoutId: 'classic', themeId: 'navy' },
  corporate: { layoutId: 'classic', themeId: 'navy' },
  executive: { layoutId: 'classic', themeId: 'amber' },
  // Minimal series
  minimal: { layoutId: 'minimal', themeId: 'slate' },
  nordic:  { layoutId: 'minimal', themeId: 'slate' },
  slate:   { layoutId: 'minimal', themeId: 'slate' },
  tokyo:   { layoutId: 'minimal', themeId: 'teal' },
  // Creative / special
  sidebar:  { layoutId: 'sidebar',  themeId: 'indigo' },
  dark:     { layoutId: 'dark',     themeId: 'indigo' },
  tech:     { layoutId: 'tech',     themeId: 'navy' },
  academic: { layoutId: 'academic', themeId: 'navy' },
  compact:  { layoutId: 'compact',  themeId: 'navy' },
};

/** Resolve any stored value — new {layoutId,themeId} or a legacy string id. */
export function resolveTemplate(
  value: { layoutId?: string; themeId?: string } | string | undefined
): { layoutId: LayoutId; themeId: ThemeId } {
  if (typeof value === 'string') {
    return LEGACY_TEMPLATE_MAP[value] ?? { layoutId: DEFAULT_LAYOUT, themeId: DEFAULT_THEME };
  }
  if (value && value.layoutId) {
    return {
      layoutId: getLayout(value.layoutId).id,
      themeId: getTheme(value.themeId).id,
    };
  }
  return { layoutId: DEFAULT_LAYOUT, themeId: DEFAULT_THEME };
}
