import { cn } from '@/lib/utils';

// Country and language marker.
//
// Flag emoji were used everywhere, and Windows has no flag glyphs at all — it
// renders 🇺🇿 as a bare "UZ", which looked like a bug next to the proper flags
// people saw on phones. A two-letter badge is drawn by us, so it looks the same
// on every platform.

const CODES: Record<string, string> = {
  // languages
  en: 'EN', ko: 'KO', uz: 'UZ', ru: 'RU', zh: 'ZH', vi: 'VI',
  // countries
  uzbekistan: 'UZ', kazakhstan: 'KZ', kyrgyzstan: 'KG',
  mongolia: 'MN', china: 'CN', vietnam: 'VN', other: '••',
};

/** The two-letter code for a locale or country key, for use in plain text
 *  contexts such as <option>, where a component cannot be rendered. */
export function flagCode(key: string): string {
  return CODES[key] ?? key.slice(0, 2).toUpperCase();
}

export function FlagBadge({ code, className }: { code: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex items-center justify-center shrink-0',
        'w-6 h-[18px] rounded-[4px] text-[9px] font-bold tracking-wide',
        'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
        className
      )}
    >
      {flagCode(code)}
    </span>
  );
}
