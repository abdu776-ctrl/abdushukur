import { NextRequest, NextResponse } from 'next/server';
import { guardAiRequest } from '@/lib/aiGuard';
import { VOICE_GUEST_DAILY_LIMIT, VOICE_USER_DAILY_LIMIT } from '@/lib/aiLimits';
import { ELEVEN_BASE, ELEVEN_MODEL, defaultVoice, elevenKey } from '@/lib/elevenlabs';

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

    const { text, speaker, voiceId } = await req.json();
    if (speaker !== 'teacher' && speaker !== 'child') {
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
      typeof voiceId === 'string' && /^[A-Za-z0-9]{8,64}$/.test(voiceId) ? voiceId : defaultVoice(speaker);
    // No provider or no voice to speak with: the page uses the browser voice.
    if (!apiKey || !voice) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

    const res = await fetch(`${ELEVEN_BASE}/text-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: ELEVEN_MODEL,
        language_code: 'ko',
        // A teacher is steady and clear; a child is livelier and less even,
        // which also lets more of the child's own accent through.
        voice_settings:
          speaker === 'teacher'
            ? { stability: 0.6, similarity_boost: 0.85, style: 0.2, use_speaker_boost: true, speed: 0.95 }
            : { stability: 0.35, similarity_boost: 0.9, style: 0.45, use_speaker_boost: true, speed: 0.9 },
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
