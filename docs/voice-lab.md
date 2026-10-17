# Voice lab

`/[locale]/voice-lab` — a female Korean teacher asks questions in Korean, and a
child aged 6–14 from Uzbekistan answers in Korean, with an Uzbek accent. Both
voices can be cloned from a short recording.

## How the accent is made

Two things together:

1. **The cloned voice.** A recording of a real Uzbek child carries the child's
   own timbre and much of their accent; the speech model keeps both when it
   speaks Korean.
2. **Respelling.** The child's line is respelled before it is spoken, the way
   Uzbek beginners tend to say it (`lib/voiceLab.ts → accentify`): tense
   consonants become plain (떡볶이 → 덕복이), ㅓ drifts to ㅗ, ㅐ and ㅔ merge,
   ㅡ becomes ㅜ (는 → 눈). The strength follows the accent level (none, slight,
   noticeable). Tick "show what the child actually says" to see the respelled
   text.

## Fluent children are a full case

Not every child is a beginner. A child who has lived in Korea for years, or
goes to a Korean school, answers in natural, accent-free Korean with correct
존댓말 — and the page treats that as an equal case, not an exception.

- **Accent level** (`Aksentsiz` / `Yengil aksent` / `Sezilarli aksent`) is
  chosen when a child voice is cloned, saved with the voice, and shown as a
  badge on it.
- **Level presets** set accent, answer style and learner errors together:

  | Daraja | Accent | Answer style | Learner errors |
  | --- | --- | --- | --- |
  | Yangi kelgan | noticeable | beginner, frequent 반말 slips | on |
  | Oʻrta | slight | occasional 반말 → self-correction | 반말 + hesitation |
  | Ravon | none | fluent 존댓말 | off |

- **Answer styles** (`Javob turi`): 1. beginner (accent + 반말), 2. 반말 →
  self-correction, 3. correct 존댓말 with an accent, 4. fluent 존댓말 with no
  accent. Choosing 4 turns the learner-error toggles off and warns when the
  child's cloned voice has an accent. "Variantlar yaratish" shows all four
  under every answer.
- **Ikki bola**: each teacher question is answered by a beginner (accent +
  반말) and then by a fluent child (no accent + 존댓말), followed by a one-line
  Uzbek comparison.
- Every built-in child line has a fluent version (`fluent` in
  `lib/voiceLab.ts`), slightly longer and more complete — 저는, -는데, -이랑 —
  which is how advanced learners actually sound. The AI dialogue asks for one
  too.

Without a cloned voice the page still works, using the device's Korean voice
with a raised pitch for the child.

## Server settings (Vercel → Settings → Environment Variables)

| Variable | Needed for | |
| --- | --- | --- |
| `ELEVENLABS_API_KEY` | cloning and the cloned voices speaking | required for cloning |
| `ELEVENLABS_TEACHER_VOICE_ID` | a stock teacher voice before anyone clones one | optional |
| `ELEVENLABS_CHILD_VOICE_ID` | a stock child voice before anyone clones one | optional |
| `ELEVENLABS_MODEL` | override the speech model (default `eleven_multilingual_v2`) | optional |
| `GROQ_API_KEY` | "Create with AI" dialogues (already used by the assistant) | optional |

Instant voice cloning needs an ElevenLabs plan that includes it (Starter or
higher at the time of writing).

## Safeguards

- Cloning needs an account and a ticked consent box; for the child, the box is
  the parent's or guardian's consent.
- Each cloned voice is labelled with its owner on the provider side, and only
  that owner can delete it.
- Voice samples leave the device only when "Clone voice" is pressed.
- Spoken lines have their own daily budget (`VOICE_*_DAILY_LIMIT` in
  `lib/aiLimits.ts`), so the voice lab cannot spend the assistant's.
- Only this page may use the microphone (`Permissions-Policy` in
  `next.config.ts`).

## In the Android app

The app loads the live site, so the page is there as soon as it deploys. To
record inside the app, the APK must hold `RECORD_AUDIO`; the
`Android APK` workflow adds it, and a local build needs the same two lines in
`android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

Uploading a recorded file works without them.
