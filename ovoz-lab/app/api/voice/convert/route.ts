import { NextRequest, NextResponse } from 'next/server';
import { guardAiRequest } from '@/lib/aiGuard';
import { ELEVEN_BASE, ELEVEN_STS_MODEL, defaultVoice, elevenKey } from '@/lib/elevenlabs';

// Change a recording into another voice: the same words, the same timing,
// said by the teacher, a boy or a girl. The target is a cloned voice when the
// page has one for it, otherwise the stock voice for that role.
//
// Like cloning, it takes someone's recording and makes something new from it,
// so it needs an account and the uploader's word that they may use it. With
// no provider, the page shifts the pitch in the browser instead.

const MAX_AUDIO_BYTES = 4_000_000;

export async function POST(req: NextRequest) {
  try {
    const guard = await guardAiRequest(req, {
      requireAccount: true,
      maxBytes: MAX_AUDIO_BYTES + 50_000,
      bucket: 'voice-convert',
      limits: { guest: 0, user: 40 },
    });
    if (!guard.ok) {
      return NextResponse.json({ error: guard.reason }, { status: guard.status ?? 429 });
    }

    const apiKey = elevenKey();
    if (!apiKey) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

    const form = await req.formData();
    const target = form.get('target');
    const voiceId = String(form.get('voiceId') ?? '');
    const audio = form.get('audio');

    if (target !== 'teacher' && target !== 'boy' && target !== 'girl') {
      return NextResponse.json({ error: 'bad-target' }, { status: 400 });
    }
    if (form.get('consent') !== 'yes') {
      return NextResponse.json({ error: 'no-consent' }, { status: 400 });
    }
    if (!(audio instanceof File) || audio.size === 0) {
      return NextResponse.json({ error: 'no-audio' }, { status: 400 });
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'too-large' }, { status: 413 });
    }
    if (audio.type && !audio.type.startsWith('audio/') && !audio.type.startsWith('video/webm')) {
      return NextResponse.json({ error: 'not-audio' }, { status: 400 });
    }

    const voice = /^[A-Za-z0-9]{8,64}$/.test(voiceId)
      ? voiceId
      : defaultVoice(target === 'teacher' ? 'teacher' : 'child', target === 'teacher' ? undefined : target);
    // No voice to change into: the page shifts the pitch locally instead.
    if (!voice) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

    const upstream = new FormData();
    upstream.append('audio', audio, audio.name || 'recording.webm');
    upstream.append('model_id', ELEVEN_STS_MODEL);
    upstream.append('remove_background_noise', 'true');

    const res = await fetch(`${ELEVEN_BASE}/speech-to-speech/${voice}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, Accept: 'audio/mpeg' },
      body: upstream,
    });
    if (!res.ok || !res.body) {
      console.error('voice convert failed:', res.status, await res.text().catch(() => ''));
      // Not on this plan, or out of credits: the page changes the pitch locally.
      const plan = res.status === 401 || res.status === 402 || res.status === 403;
      return NextResponse.json({ error: plan ? 'paid-plan' : 'upstream-error' }, { status: plan ? 402 : 502 });
    }
    return new Response(res.body, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('voice convert route error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
