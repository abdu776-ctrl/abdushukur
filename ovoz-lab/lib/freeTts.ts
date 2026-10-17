// Free Korean speech, as an audio file.
//
// The browser's own voice can be heard but never saved: there is no way to
// capture speechSynthesis into a file. To let a dialogue be joined into one
// recording without a paid key, the speak route falls back to Google
// Translate's public text-to-speech, the same unofficial endpoint family the
// translate route already falls back to. It is unofficial, rate-limited and
// may change; when it fails the page still plays the browser voice.
//
// Server-only. One request takes ~200 characters, so longer lines are split
// at sentence ends; MP3 frames can be joined end to end.

const MAX_CHUNK = 180;

function chunks(text: string): string[] {
  const parts = text.match(/[^.!?…]+[.!?…]*\s*/g) ?? [text];
  const out: string[] = [];
  let cur = '';
  for (const p of parts) {
    if ((cur + p).length > MAX_CHUNK && cur) {
      out.push(cur.trim());
      cur = '';
    }
    cur += p;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.flatMap((c) => (c.length > MAX_CHUNK ? c.match(new RegExp(`.{1,${MAX_CHUNK}}`, 'g')) ?? [] : [c]));
}

/** MP3 of `text` read in Korean, or null when the service will not answer. */
export async function freeKoreanTts(text: string, speed = 1): Promise<Uint8Array | null> {
  try {
    const parts: Uint8Array[] = [];
    for (const c of chunks(text)) {
      const url =
        'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ko' +
        `&ttsspeed=${Math.max(0.3, Math.min(1, speed))}&q=${encodeURIComponent(c)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' });
      if (!res.ok) return null;
      const type = res.headers.get('content-type') ?? '';
      if (!type.includes('audio')) return null;
      parts.push(new Uint8Array(await res.arrayBuffer()));
    }
    const total = parts.reduce((n, p) => n + p.length, 0);
    const joined = new Uint8Array(total);
    let at = 0;
    for (const p of parts) {
      joined.set(p, at);
      at += p.length;
    }
    return total > 0 ? joined : null;
  } catch (err) {
    console.error('free tts failed:', err);
    return null;
  }
}
