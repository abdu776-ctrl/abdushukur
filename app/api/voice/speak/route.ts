import { NextRequest, NextResponse } from 'next/server';
import { guardAiRequest } from '@/lib/aiGuard';
import { VOICE_GUEST_DAILY_LIMIT, VOICE_USER_DAILY_LIMIT } from '@/lib/aiLimits';
import { ELEVEN_BASE, ELEVEN_MODEL, defaultVoice, elevenKey } from '@/lib/elevenlabs';
import { ACCENT, type AccentLevel } from '@/lib/voiceLab';
import { freeKoreanTts } from '@/lib/freeTts';

/** One line of dialogue, not a speech. */
const MAX_TEXT = 400;

export async function POST(req: NextRequest) {
  try {
    const guard = await guardAiRequest(req, {
      bucket: 'voice',
      limits: { guest: VOICE_GUEST_DAILY_LIMIT, user: VOICE_USER_DAILY_LIMIT },
      burstPerMinute: 40,
    });
    if (!guard.ok) {
      return NextResponse.json({ error: guard.reason }, { status: guard.status ?? 429 });
    }

    const { text, speaker, voiceId, accent, gender } = await req.json();
    if (speaker !== 'teacher' && speaker !== 'child' && speaker !== 'child2') {
      return NextResponse.json({ error: 'bad-speaker' }, { status: 400 });
    }
    if (typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'no-text' }, { status: 400 });
    }
    if (text.length > MAX_TEXT) {
      return NextResponse.json({ error: 'too-large' }, { status: 413 });
    }

    const apiKey = elevenKey();
    const voice =
      typeof voiceId === 'string' && /^[A-Za-z0-9]{8,64}$/.test(voiceId)
        ? voiceId
        : defaultVoice(
            speaker === 'teacher' ? 'teacher' : 'child',
            gender === 'girl' || gender === 'boy' ? gender : undefined
          );
    // A noticeable accent is slower; a fluent child speaks at a normal pace.
    const level: AccentLevel = typeof accent === 'string' && accent in ACCENT ? (accent as AccentLevel) : 'slight';
    const pace = ACCENT[level].rate;
    // No provider or no voice to speak with: a free voice, as a file, so the
    // dialogue can still be saved. It is one adult voice; the page pitches it
    // up for a child (X-Voice: free tells it to). Failing that, 503, and the
    // page uses the browser voice.
    if (!apiKey || !voice) {
      const mp3 = await freeKoreanTts(text, speaker === 'teacher' ? 1 : pace);
      if (!mp3) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
      return new Response(mp3 as unknown as BodyInit, {
        headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'X-Voice': 'free' },
      });
    }

    const res = await fetch(`${ELEVEN_BASE}/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: ELEVEN_MODEL,
        language_code: 'ko',
        // A teacher is steady and clear; a child is livelier and less even,
        // which also lets more of the child's own accent through. A fluent
        // child is steadier again: no hesitation to leave room for.
        voice_settings:
          speaker === 'teacher'
            ? { stability: 0.6, similarity_boost: 0.85, style: 0.2, use_speaker_boost: true, speed: 0.95 }
            : {
                stability: level === 'none' ? 0.55 : 0.35,
                similarity_boost: 0.9,
                style: level === 'none' ? 0.3 : 0.45,
                use_speaker_boost: true,
                speed: Math.round(pace * 0.95 * 100) / 100,
              },
      }),
    });

    if (!res.ok || !res.body) {
      console.error('tts failed:', res.status, await res.text().catch(() => ''));
      return NextResponse.json({ error: 'upstream-error' }, { status: 503 });
    }

    return new Response(res.body, {
      headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('speak route error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
