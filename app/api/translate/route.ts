import { NextRequest, NextResponse } from 'next/server';

// Simple translation/transliteration proxy using Google's public translate
// endpoint. Runs server-side to avoid CORS. No API key required.
// Used mainly to convert a name between Latin/Cyrillic and Korean (Hangul).
export async function POST(req: NextRequest) {
  try {
    const { text, from = 'auto', to } = await req.json();

    if (!text || typeof text !== 'string' || !to) {
      return NextResponse.json({ error: 'Missing text or target language' }, { status: 400 });
    }

    const url =
      'https://translate.googleapis.com/translate_a/single?client=gtx' +
      `&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Translation service error' }, { status: 502 });
    }

    const data = await res.json();
    // data[0] is an array of [translatedSegment, originalSegment, ...]
    const translated: string = Array.isArray(data?.[0])
      ? data[0].map((seg: unknown[]) => (Array.isArray(seg) ? seg[0] : '')).join('')
      : '';

    return NextResponse.json({ translated });
  } catch (err) {
    console.error('translate route error:', err);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
