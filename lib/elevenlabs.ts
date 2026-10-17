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
 * straight away. Optional: without them the browser voice is the fallback.
 */
export function defaultVoice(speaker: 'teacher' | 'child'): string | null {
  return (
    (speaker === 'teacher'
      ? process.env.ELEVENLABS_TEACHER_VOICE_ID
      : process.env.ELEVENLABS_CHILD_VOICE_ID) || null
  );
}
