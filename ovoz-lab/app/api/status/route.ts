import { NextRequest, NextResponse } from 'next/server';
import { codeAccepted } from '@/lib/aiGuard';
import { ELEVEN_BASE, defaultVoice, elevenKey } from '@/lib/elevenlabs';

// What the page should say about itself: which voices are real, whether a
// code is needed, and — for the owner — how much of the month's credit is
// left, so a free plan is not spent without noticing.

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const codeRequired = !!process.env.ACCESS_CODE;
  const codeOk = codeAccepted(req);
  const key = elevenKey();

  const status: Record<string, unknown> = {
    codeRequired,
    codeOk,
    eleven: !!key,
    voices: {
      teacher: !!defaultVoice('teacher'),
      girl: !!defaultVoice('child', 'girl'),
      boy: !!defaultVoice('child', 'boy'),
    },
    ai: !!process.env.GROQ_API_KEY,
  };

  if (key && codeOk) {
    try {
      const res = await fetch(`${ELEVEN_BASE}/user/subscription`, {
        headers: { 'xi-api-key': key },
        cache: 'no-store',
      });
      if (res.ok) {
        const s = await res.json();
        status.usage = {
          used: s.character_count ?? null,
          limit: s.character_limit ?? null,
          tier: s.tier ?? null,
          resetsAt: s.next_character_count_reset_unix ?? null,
          cloning: s.can_use_instant_voice_cloning ?? null,
        };
      }
    } catch {
      // Usage is a nicety; the page works without it.
    }
  }

  return NextResponse.json(status, { headers: { 'Cache-Control': 'no-store' } });
}
