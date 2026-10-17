// The voice provider for the voice lab.
//
// ElevenLabs is used because its instant cloning needs only a minute of audio
// and its multilingual model speaks Korean with the cloned timbre intact —
// which is the whole point: a child's own voice, saying Korean.
//
// Server-only. The key never reaches the browser; with no key set, the routes
// answer 503 and the page falls back to the browser's own Korean voice.

export const ELEVEN_BASE = 'https://api.elevenlabs.io/v1';

/** The model that speaks Korean. ELEVENLABS_MODEL overrides it without a deploy. */
export const ELEVEN_MODEL = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

export function elevenKey(): string | null {
  return process.env.ELEVENLABS_API_KEY || null;
}

/**
 * Stock voices used before anyone has cloned one, so the page can be heard
 * straight away, and as the target when a recording is changed into a boy's or
 * a girl's voice. Optional: without them the browser does the work.
 * ELEVENLABS_CHILD_VOICE_ID stands in for whichever child voice is missing.
 */
export function defaultVoice(speaker: 'teacher' | 'child', gender?: 'boy' | 'girl'): string | null {
  if (speaker === 'teacher') return process.env.ELEVENLABS_TEACHER_VOICE_ID || null;
  const specific =
    gender === 'girl' ? process.env.ELEVENLABS_GIRL_VOICE_ID : gender === 'boy' ? process.env.ELEVENLABS_BOY_VOICE_ID : '';
  return specific || process.env.ELEVENLABS_CHILD_VOICE_ID || null;
}

/** The model that changes one voice into another (speech-to-speech). */
export const ELEVEN_STS_MODEL = process.env.ELEVENLABS_STS_MODEL || 'eleven_multilingual_sts_v2';
