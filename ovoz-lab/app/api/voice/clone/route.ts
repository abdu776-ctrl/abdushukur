import { NextRequest, NextResponse } from 'next/server';
import { guardAiRequest } from '@/lib/aiGuard';
import { ELEVEN_BASE, elevenKey } from '@/lib/elevenlabs';
import { ACCENT_LEVELS, accentDescription, type AccentLevel } from '@/lib/voiceLab';

// Cloning makes a lasting copy of someone's voice on the provider's side, so
// it needs an account (the voice is labelled with its owner, and only that
// owner may delete it) and an explicit statement of consent. For a child, the
// consent is the parent's or guardian's.

/** Vercel refuses request bodies above 4.5 MB; stay under it. */
const MAX_AUDIO_BYTES = 4_000_000;
const MAX_FILES = 5;

export async function POST(req: NextRequest) {
  try {
    const guard = await guardAiRequest(req, {
      requireAccount: true,
      maxBytes: MAX_AUDIO_BYTES + 50_000,
      bucket: 'voice-clone',
      limits: { guest: 0, user: 10 },
    });
    if (!guard.ok) {
      return NextResponse.json({ error: guard.reason }, { status: guard.status ?? 429 });
    }

    const apiKey = elevenKey();
    if (!apiKey) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

    const form = await req.formData();
    const speaker = form.get('speaker');
    const label = String(form.get('label') ?? '').trim().slice(0, 40);
    const consent = form.get('consent');
    const files = form.getAll('files').filter((f): f is File => f instanceof File);

    if (speaker !== 'teacher' && speaker !== 'child' && speaker !== 'child2') {
      return NextResponse.json({ error: 'bad-speaker' }, { status: 400 });
    }
    // A child's voice is saved with its accent level; a fluent child is a
    // voice of its own, not a beginner's voice with the accent turned down.
    const rawAccent = String(form.get('accentLevel') ?? 'slight');
    const accentLevel: AccentLevel = (ACCENT_LEVELS as string[]).includes(rawAccent)
      ? (rawAccent as AccentLevel)
      : 'slight';
    const age = Math.max(6, Math.min(14, Number(form.get('age')) || 10));
    const gender = form.get('gender') === 'girl' ? 'girl' : 'boy';
    if (consent !== 'yes') {
      return NextResponse.json({ error: 'no-consent' }, { status: 400 });
    }
    if (files.length === 0 || files.length > MAX_FILES) {
      return NextResponse.json({ error: 'no-audio' }, { status: 400 });
    }
    const total = files.reduce((n, f) => n + f.size, 0);
    if (total > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'too-large' }, { status: 413 });
    }
    if (files.some((f) => f.type && !f.type.startsWith('audio/') && !f.type.startsWith('video/webm'))) {
      return NextResponse.json({ error: 'not-audio' }, { status: 400 });
    }

    const upstream = new FormData();
    upstream.append('name', `koreer-${speaker}-${label || 'voice'}`);
    upstream.append(
      'description',
      speaker === 'teacher'
        ? 'Korean teacher (female), voice lab'
        : `${accentDescription(accentLevel, age, gender)} Cloned with guardian consent.`
    );
    upstream.append(
      'labels',
      JSON.stringify({
        owner: guard.userId,
        app: 'koreer',
        speaker,
        ...(speaker === 'teacher' ? {} : { accent: accentLevel, gender }),
      })
    );
    upstream.append('remove_background_noise', 'true');
    files.forEach((f, i) => upstream.append('files', f, f.name || `sample-${i}.webm`));

    const res = await fetch(`${ELEVEN_BASE}/voices/add`, {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: upstream,
    });
    if (!res.ok) {
      console.error('voice clone failed:', res.status, await res.text().catch(() => ''));
      // The free plan has no instant cloning: say so, rather than "failed".
      const plan = res.status === 401 || res.status === 402 || res.status === 403;
      return NextResponse.json({ error: plan ? 'paid-plan' : 'upstream-error' }, { status: plan ? 402 : 502 });
    }
    const data = await res.json();
    return NextResponse.json({
      voiceId: data.voice_id,
      ...(speaker === 'teacher' ? {} : { accentLevel, gender }),
    });
  } catch (err) {
    console.error('voice clone route error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

/** Delete a cloned voice — only one this account made. */
export async function DELETE(req: NextRequest) {
  try {
    const guard = await guardAiRequest(req, {
      requireAccount: true,
      bucket: 'voice-clone',
      limits: { guest: 0, user: 50 },
    });
    if (!guard.ok) {
      return NextResponse.json({ error: guard.reason }, { status: guard.status ?? 429 });
    }
    const apiKey = elevenKey();
    if (!apiKey) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

    const voiceId = req.nextUrl.searchParams.get('voiceId') ?? '';
    if (!/^[A-Za-z0-9]{8,64}$/.test(voiceId)) {
      return NextResponse.json({ error: 'bad-voice' }, { status: 400 });
    }

    const info = await fetch(`${ELEVEN_BASE}/voices/${voiceId}`, { headers: { 'xi-api-key': apiKey } });
    if (info.status === 404) return NextResponse.json({ ok: true });
    const voice = info.ok ? await info.json() : null;
    if (voice?.labels?.owner !== guard.userId) {
      return NextResponse.json({ error: 'not-yours' }, { status: 403 });
    }

    const res = await fetch(`${ELEVEN_BASE}/voices/${voiceId}`, {
      method: 'DELETE',
      headers: { 'xi-api-key': apiKey },
    });
    if (!res.ok && res.status !== 404) {
      return NextResponse.json({ error: 'upstream-error' }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('voice delete route error:', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
