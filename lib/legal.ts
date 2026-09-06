// Contact address shown on the Privacy Policy and Terms pages, and the date
// those documents were last reviewed. Both are required by app stores, so keep
// them accurate — change the address here and it updates on every page and in
// every language.

export const SUPPORT_EMAIL = 'abdu776@hanyang.ac.kr';

/** ISO date of the last review of the legal pages. */
export const LEGAL_LAST_UPDATED = '2026-09-06';

export function formatLegalDate(locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
      .format(new Date(LEGAL_LAST_UPDATED));
  } catch {
    return LEGAL_LAST_UPDATED;
  }
}
