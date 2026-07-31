import { NextRequest, NextResponse } from 'next/server';

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const LANG_NAMES: Record<string, string> = {
  uz: 'Uzbek',
  ru: 'Russian',
  en: 'English',
  ko: 'Korean',
};

// ── Groq (primary — reliable for names and sentences) ────────────────────────
async function groqComplete(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 256,
    }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content || '';
  return text.trim().replace(/^["'`]+|["'`]+$/g, '');
}

async function groqTranslate(
  apiKey: string,
  text: string,
  from: string,
  to: string,
  mode: string
): Promise<string> {
  let prompt: string;
  if (mode === 'name' && to === 'ko') {
    const origin = from && from !== 'auto' ? `${LANG_NAMES[from] || from} ` : 'Uzbek/Russian/English ';
    prompt =
      `Transliterate this ${origin}person's name into Korean Hangul based on pronunciation.\n` +
      `Sound rules: Latin/Cyrillic "j" (ж) → ㅈ ("ja"→자, "jo"→조, "ju"→주, "ji"→지); ` +
      `"zh"→ㅈ, "ch"(ч)→치, "sh"(ш)→시, "kh"(х)→흐; "ya"→야, "yo"→요, "yu"→유; "-ov/-ev"→"-프".\n` +
      `Examples: "Olimjonov" → 올림조노프, "Abdushukur" → 압두슈쿠르.\n` +
      `Reply with ONLY the Korean Hangul transliteration — no explanation, no quotes.\n\nName: ${text}`;
  } else if (mode === 'name' && from === 'ko') {
    prompt =
      `Romanize this Korean name into Latin letters (Revised Romanization), capitalizing each part. ` +
      `Reply with ONLY the romanized name.\n\nName: ${text}`;
  } else {
    const target = LANG_NAMES[to] || to;
    const src = from && from !== 'auto' ? `from ${LANG_NAMES[from] || from} ` : '';
    prompt =
      `Translate the following text ${src}into ${target}. ` +
      `Reply with ONLY the translated text, nothing else.\n\n${text}`;
  }
  return groqComplete(apiKey, prompt);
}

// ── Google Translate (fallback) ──────────────────────────────────────────────
async function googleTranslate(text: string, from: string, to: string): Promise<string> {
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx' +
    `&sl=${encodeURIComponent(from)}&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' });
  if (!res.ok) throw new Error('translate service error');
  const data = await res.json();
  return Array.isArray(data?.[0])
    ? data[0].map((seg: unknown[]) => (Array.isArray(seg) ? seg[0] : '')).join('')
    : '';
}

async function fallbackTranslate(text: string, from: string, to: string, mode: string): Promise<string> {
  if (mode === 'name' && to === 'ko') {
    const hasCyrillic = /[а-яА-ЯёЁ]/.test(text);
    return googleTranslate(text, hasCyrillic ? 'ru' : 'en', 'ko');
  }
  const sl = from && from !== 'auto' ? from : 'auto';
  return googleTranslate(text, sl, to);
}

export async function POST(req: NextRequest) {
  try {
    const { text, from = 'auto', to, mode = 'text' } = await req.json();

    if (!text || typeof text !== 'string' || !to) {
      return NextResponse.json({ error: 'Missing text or target language' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;

    // Primary: Groq (accurate for names and sentences).
    if (apiKey) {
      try {
        const translated = await groqTranslate(apiKey, text, from, to, mode);
        if (translated) return NextResponse.json({ translated });
      } catch (err) {
        console.error('groq translate failed, falling back:', err);
      }
    }

    // Fallback: Google Translate.
    const translated = await fallbackTranslate(text, from, to, mode);
    return NextResponse.json({ translated });
  } catch (err) {
    console.error('translate route error:', err);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
