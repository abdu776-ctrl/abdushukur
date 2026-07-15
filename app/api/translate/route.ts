import { NextRequest, NextResponse } from 'next/server';

// Basic Cyrillic -> Latin romanization so Russian-script names can be
// transliterated into Korean (Google Input Tools expects Latin input).
const CYRILLIC_MAP: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya',
};

function romanizeCyrillic(text: string): string {
  return text
    .split('')
    .map((ch) => {
      const lower = ch.toLowerCase();
      const mapped = CYRILLIC_MAP[lower];
      if (mapped === undefined) return ch;
      return mapped;
    })
    .join('');
}

// Transliterate a single Latin word into Korean Hangul using Google's
// public Input Tools transliteration endpoint (the same engine used for
// phonetic keyboards). This is what actually converts names correctly,
// unlike the translate endpoint which mistranslates names as words.
async function transliterateWordToKorean(word: string): Promise<string> {
  const clean = word.trim();
  if (!clean) return '';
  if (!/[a-zA-Z]/.test(clean)) return clean;

  const url =
    'https://inputtools.google.com/request?itc=ko-t-i0-und&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&text=' +
    encodeURIComponent(clean.toLowerCase());

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    });
    if (!res.ok) return clean;
    const data = await res.json();
    if (data?.[0] === 'SUCCESS' && data?.[1]?.[0]?.[1]?.[0]) {
      return data[1][0][1][0] as string;
    }
    return clean;
  } catch {
    return clean;
  }
}

async function transliterateToKorean(text: string): Promise<string> {
  // Romanize any Cyrillic first, then transliterate word by word.
  const latin = romanizeCyrillic(text);
  const words = latin.trim().split(/\s+/);
  const out: string[] = [];
  for (const w of words) {
    out.push(await transliterateWordToKorean(w));
  }
  return out.join(' ');
}

async function googleTranslate(text: string, from: string, to: string): Promise<string> {
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx' +
    `&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('translate service error');
  const data = await res.json();
  return Array.isArray(data?.[0])
    ? data[0].map((seg: unknown[]) => (Array.isArray(seg) ? seg[0] : '')).join('')
    : '';
}

// Romanize Korean (Hangul) to Latin using the translate endpoint's
// romanization output (dt=rm).
async function romanizeKorean(text: string): Promise<string> {
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx' +
    `&sl=ko&tl=en&dt=rm&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('romanize error');
  const data = await res.json();
  // Romanization of the source sits in the 4th slot of each segment.
  const roman = Array.isArray(data?.[0])
    ? data[0]
        .map((seg: unknown[]) => (Array.isArray(seg) ? (seg[3] as string) || '' : ''))
        .join('')
        .trim()
    : '';
  // Capitalize each word for a name-like result.
  return roman
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export async function POST(req: NextRequest) {
  try {
    const { text, from = 'auto', to, mode = 'text' } = await req.json();

    if (!text || typeof text !== 'string' || !to) {
      return NextResponse.json({ error: 'Missing text or target language' }, { status: 400 });
    }

    // "name" mode = transliterate a person's name between scripts.
    // Full sentences must NOT be transliterated, so this only runs for names.
    if (mode === 'name') {
      if (to === 'ko' && /[a-zA-Zа-яА-ЯёЁ]/.test(text)) {
        const translated = await transliterateToKorean(text);
        return NextResponse.json({ translated });
      }
      if (from === 'ko' && to !== 'ko') {
        try {
          const roman = await romanizeKorean(text);
          if (roman) return NextResponse.json({ translated: roman });
        } catch {
          // fall through to plain translate
        }
      }
    }

    // Default: plain translation (sentences, paragraphs, cover letters).
    const translated = await googleTranslate(text, from, to);
    return NextResponse.json({ translated });
  } catch (err) {
    console.error('translate route error:', err);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
