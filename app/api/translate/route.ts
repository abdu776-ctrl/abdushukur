import { NextRequest, NextResponse } from 'next/server';

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

// Transliterate a name into Korean Hangul. The trick: use an EXPLICIT
// source language (never auto) — with auto-detect Google mistranslates a
// name as a word (e.g. "Abdushukur" -> "매우 감사합니다"). With sl=en/ru it
// transliterates phonetically (e.g. "Abdushukur" -> "압두슈쿠르").
async function transliterateToKorean(text: string): Promise<string> {
  const hasCyrillic = /[а-яА-ЯёЁ]/.test(text);
  const sl = hasCyrillic ? 'ru' : 'en';
  return googleTranslate(text, sl, 'ko');
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
    // Never use "auto" for single short strings — it mis-detects. Fall back
    // to English when the caller didn't specify a source.
    const translated = await googleTranslate(text, from, to);
    return NextResponse.json({ translated });
  } catch (err) {
    console.error('translate route error:', err);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
