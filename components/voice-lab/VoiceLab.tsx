'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { accessToken, aiErrorKey, aiFetch } from '@/lib/aiClient';
import { useAuth } from '@/lib/useAuth';
import { cn } from '@/lib/utils';
import {
  ACCENT_LEVELS,
  ANSWER_STYLES,
  LEVELS,
  LEVEL_PRESETS,
  SCENARIOS,
  errorsFor,
  loadVoices,
  renderAnswer,
  saveVoices,
  scenarioLines,
  type AccentLevel,
  type Answer,
  type AnswerStyle,
  type ChildProfile,
  type ClonedVoice,
  type DialogueLine,
  type LearnerErrors,
  type Level,
  type Speaker,
  type VoiceSlot,
} from '@/lib/voiceLab';
import {
  Mic,
  Square,
  Upload,
  Play,
  Pause,
  Trash2,
  Sparkles,
  GraduationCap,
  Baby,
  Volume2,
  Download,
  Check,
  Users,
  Layers,
  AlertTriangle,
} from 'lucide-react';

/** What each speaker reads aloud for the sample: varied sounds, ~40 seconds. */
const READ_ALOUD: Record<Speaker, string> = {
  teacher:
    '안녕하세요, 여러분. 오늘은 한국어로 자기소개를 해 볼 거예요. 천천히 따라 해 보세요. ' +
    '하늘이 맑고 바람이 시원해요. 우리 반 친구들은 모두 열심히 공부해요. ' +
    '질문이 있으면 손을 들고 말해 주세요. 잘했어요! 아주 훌륭해요.',
  child:
    'Assalomu alaykum! Mening ismim … . Men Oʻzbekistondan keldim. ' +
    '안녕하세요. 저는 우즈베키스탄에서 왔어요. 한국어를 공부해요. ' +
    'Bir, ikki, uch, toʻrt, besh. 하나, 둘, 셋, 넷, 다섯. ' +
    'Men oshni yaxshi koʻraman. 저는 떡볶이를 좋아해요. 감사합니다!',
};

const MIN_SAMPLE_SECONDS = 20;
const MAX_UPLOAD_BYTES = 4_000_000;

interface Sample {
  blob: Blob;
  /** Made once, so a re-render does not leak a new object URL. */
  url: string;
  name: string;
  seconds: number;
}

/** Pick a Korean voice from the device, preferring a female one for the teacher. */
function deviceVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const ko = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('ko'));
  return (
    ko.find((v) => /female|yuna|sunhi|heami|seoyeon|jimin/i.test(v.name)) ?? ko[0] ?? null
  );
}

function speakWithDevice(text: string, speaker: Speaker, age: number, rate = 1): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    const v = deviceVoice();
    if (v) u.voice = v;
    // No cloned voice: approximate a child by pitch, higher the younger.
    u.pitch = speaker === 'teacher' ? 1.1 : Math.min(2, 1.9 - (age - 6) * 0.07);
    u.rate = speaker === 'teacher' ? 0.95 : 0.9 * rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

async function durationOf(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const a = document.createElement('audio');
    a.preload = 'metadata';
    a.onloadedmetadata = () => {
      // MediaRecorder webm reports Infinity until seeked; the caller knows the
      // recorded length anyway, so 0 here just means "unknown".
      resolve(Number.isFinite(a.duration) ? a.duration : 0);
      URL.revokeObjectURL(a.src);
    };
    a.onerror = () => resolve(0);
    a.src = URL.createObjectURL(blob);
  });
}

// ── One speaker's voice card ──────────────────────────────────────────────

/** Short label for an accent level, as a badge on a saved voice. */
function useAccentLabel() {
  const t = useTranslations('voiceLab');
  return (level: AccentLevel) =>
    t(level === 'none' ? 'accentNone' : level === 'slight' ? 'accentSlight' : 'accentNoticeable');
}

function VoiceCard({
  speaker,
  voice,
  onCloned,
  onRemoved,
  signedIn,
  childName,
  age,
  defaultAccent,
}: {
  speaker: VoiceSlot;
  voice?: ClonedVoice;
  onCloned: (v: ClonedVoice) => void;
  onRemoved: () => void;
  signedIn: boolean;
  childName: string;
  age: number;
  /** What a new child voice is set to before anyone changes it. */
  defaultAccent: AccentLevel;
}) {
  const accentLabel = useAccentLabel();
  const isChild = speaker !== 'teacher';
  const [accentLevel, setAccentLevel] = useState<AccentLevel>(defaultAccent);
  const t = useTranslations('voiceLab');
  const terr = useTranslations('errors');
  const locale = useLocale();
  const [samples, setSamples] = useState<Sample[]>([]);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const totalSeconds = Math.round(samples.reduce((n, s) => n + s.seconds, 0));
  const totalBytes = samples.reduce((n, s) => n + s.blob.size, 0);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recorderRef.current?.stream.getTracks().forEach((tr) => tr.stop());
    },
    []
  );

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      const started = Date.now();
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
        const ext = blob.type.includes('mp4') ? 'm4a' : blob.type.includes('ogg') ? 'ogg' : 'webm';
        setSamples((prev) => [
          ...prev,
          {
            blob,
            url: URL.createObjectURL(blob),
            name: `${speaker}-${prev.length + 1}.${ext}`,
            seconds: (Date.now() - started) / 1000,
          },
        ]);
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    } catch {
      setError(t('micDenied'));
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function addFiles(list: FileList | null) {
    if (!list) return;
    const added: Sample[] = [];
    for (const f of Array.from(list)) {
      if (!f.type.startsWith('audio/')) continue;
      added.push({ blob: f, url: URL.createObjectURL(f), name: f.name, seconds: await durationOf(f) });
    }
    setSamples((prev) => [...prev, ...added].slice(0, 5));
  }

  async function clone() {
    setError(null);
    if (totalBytes > MAX_UPLOAD_BYTES) {
      setError(t('tooLarge'));
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append('speaker', speaker);
      form.append('label', isChild ? childName : 'teacher');
      form.append('consent', consent ? 'yes' : 'no');
      if (isChild) {
        form.append('accentLevel', accentLevel);
        form.append('age', String(age));
      }
      samples.forEach((s) => form.append('files', s.blob, s.name));
      const token = await accessToken();
      const res = await fetch('/api/voice/clone', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const key = aiErrorKey(res.status, signedIn, body.error);
        setError(key ? terr(key) : t('cloneFailed'));
        return;
      }
      const { voiceId } = await res.json();
      onCloned({
        voiceId,
        label: isChild ? childName : t('teacher'),
        createdAt: new Date().toISOString(),
        ...(isChild ? { accentLevel } : {}),
      });
      setSamples([]);
    } catch {
      setError(t('cloneFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!voice) return;
    setBusy(true);
    try {
      const token = await accessToken();
      await fetch(`/api/voice/clone?voiceId=${encodeURIComponent(voice.voiceId)}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // Forget it locally regardless; the provider copy is labelled with its owner.
    } finally {
      onRemoved();
      setBusy(false);
    }
  }

  const Icon = isChild ? Baby : GraduationCap;
  const enough = totalSeconds >= MIN_SAMPLE_SECONDS || samples.some((s) => s.seconds === 0);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            speaker === 'teacher'
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300'
              : speaker === 'child'
                ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300'
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {speaker === 'teacher' ? t('teacher') : speaker === 'child' ? t('child') : t('child2')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {speaker === 'teacher' ? t('teacherHint') : speaker === 'child' ? t('childHint') : t('child2Hint')}
          </p>
        </div>
      </div>

      {voice ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
          <span className="flex flex-wrap items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <Check className="w-4 h-4" />
            {t('cloned', { name: voice.label })}
            {voice.accentLevel && (
              <span className="rounded-full bg-white/70 dark:bg-gray-900/60 px-2 py-0.5 text-xs font-medium">
                {accentLabel(voice.accentLevel)}
              </span>
            )}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={remove}
            loading={busy}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            aria-label={t('removeVoice', { name: voice.label })}
          >
            {t('remove')}
          </Button>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('browserVoice')}</p>

          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('readAloud')}</p>
            <p lang={isChild ? undefined : 'ko'} className="text-sm leading-relaxed rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 text-gray-800 dark:text-gray-200">
              {READ_ALOUD[isChild ? 'child' : 'teacher']}
            </p>
          </div>

          {isChild && (
            <label className="block text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('accentLevel')}</span>
              <select
                value={accentLevel}
                onChange={(e) => setAccentLevel(e.target.value as AccentLevel)}
                className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
              >
                {ACCENT_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {accentLabel(l)}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('accentLevelHint')}</span>
            </label>
          )}

          <div className="flex flex-wrap gap-2">
            {recording ? (
              <Button variant="danger" size="sm" onClick={stopRecording} icon={<Square className="w-3.5 h-3.5" />}>
                {t('stop')} · {elapsed}s
              </Button>
            ) : (
              <Button size="sm" onClick={startRecording} icon={<Mic className="w-3.5 h-3.5" />}>
                {t('record')}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              icon={<Upload className="w-3.5 h-3.5" />}
            >
              {t('upload')}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          {samples.length > 0 && (
            <ul className="space-y-1.5">
              {samples.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <audio controls src={s.url} className="h-8 flex-1 min-w-0" />
                  <button
                    onClick={() => setSamples((prev) => prev.filter((_, j) => j !== i))}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label={t('deleteSample', { n: i + 1 })}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
              <li className="text-xs text-gray-500 dark:text-gray-400">
                {t('samplesTotal', { seconds: totalSeconds, min: MIN_SAMPLE_SECONDS })}
              </li>
            </ul>
          )}

          <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              className="mt-1"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>{isChild ? t('consentChild') : t('consentTeacher')}</span>
          </label>

          {signedIn ? (
            <Button
              onClick={clone}
              loading={busy}
              disabled={!consent || samples.length === 0 || !enough || recording}
              icon={<Sparkles className="w-4 h-4" />}
            >
              {t('clone')}
            </Button>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <Link href={`/${locale}/auth/login`} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                {t('signInToClone')}
              </Link>
            </p>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </Card>
  );
}

// ── The page ──────────────────────────────────────────────────────────────

type Mode = 'single' | 'two';

/** One spoken turn on screen. */
type Turn =
  | { kind: 'teacher'; line: DialogueLine }
  | { kind: 'child'; slot: 'child' | 'child2'; name: string; line: DialogueLine; answer: Answer }
  | { kind: 'compare'; first: Answer };

const STYLE_KEYS: Record<AnswerStyle, string> = {
  learner: 'styleLearner',
  selfCorrect: 'styleSelfCorrect',
  polite: 'stylePolite',
  fluent: 'styleFluent',
};

const LEVEL_KEYS: Record<Level, string> = {
  beginner: 'levelBeginner',
  intermediate: 'levelIntermediate',
  fluent: 'levelFluent',
};

/** The beginner in "two children": accent and 반말, always shown. */
const BEGINNER_TURN = { ...LEVEL_PRESETS.beginner, force: true };
const FLUENT_TURN = { ...LEVEL_PRESETS.fluent };

const selectClass =
  'mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white';

export function VoiceLab() {
  const t = useTranslations('voiceLab');
  const terr = useTranslations('errors');
  const accentLabel = useAccentLabel();
  const { status } = useAuth();
  const signedIn = status === 'authenticated';

  const [voices, setVoices] = useState<Partial<Record<VoiceSlot, ClonedVoice>>>({});
  const [childName, setChildName] = useState('아지즈');
  const [child2Name, setChild2Name] = useState('마디나');
  const [age, setAge] = useState(8);
  const [level, setLevel] = useState<Level | null>('intermediate');
  const [profile, setProfile] = useState<ChildProfile>(LEVEL_PRESETS.intermediate);
  const [mode, setMode] = useState<Mode>('single');
  const [showVariants, setShowVariants] = useState(false);
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [aiLines, setAiLines] = useState<DialogueLine[] | null>(null);
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [showAccented, setShowAccented] = useState(false);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const stopRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => setVoices(loadVoices()), []);
  // Warm the device voice list; some browsers fill it asynchronously.
  useEffect(() => {
    window.speechSynthesis?.getVoices();
  }, []);

  function updateVoices(next: Partial<Record<VoiceSlot, ClonedVoice>>) {
    setVoices(next);
    saveVoices(next);
  }

  function applyLevel(l: Level) {
    setLevel(l);
    setProfile(LEVEL_PRESETS[l]);
  }
  /** Any hand change leaves the preset: the profile is now the user's own. */
  function editProfile(patch: Partial<ChildProfile>) {
    setLevel(null);
    setProfile((p) => ({ ...p, ...patch }));
  }
  function toggleError(key: keyof LearnerErrors) {
    editProfile({ errors: { ...profile.errors, [key]: !profile.errors[key] } });
  }

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const lines = useMemo(
    () => aiLines ?? scenarioLines(scenario, childName.trim() || '아지즈', age),
    [aiLines, scenario, childName, age]
  );

  const singleOpts = { style: profile.style, accent: profile.accent, errors: profile.errors };

  const turns: Turn[] = useMemo(() => {
    const opts = { style: profile.style, accent: profile.accent, errors: profile.errors };
    const out: Turn[] = [];
    for (const line of lines) {
      if (line.speaker === 'teacher') {
        out.push({ kind: 'teacher', line });
      } else if (mode === 'single') {
        out.push({ kind: 'child', slot: 'child', name: childName, line, answer: renderAnswer(line, opts) });
      } else {
        const first = renderAnswer(line, BEGINNER_TURN);
        out.push({ kind: 'child', slot: 'child', name: childName, line, answer: first });
        out.push({ kind: 'child', slot: 'child2', name: child2Name, line, answer: renderAnswer(line, FLUENT_TURN) });
        out.push({ kind: 'compare', first });
      }
    }
    return out;
  }, [lines, mode, childName, child2Name, profile]);

  const childVoice = voices.child;
  const fluentVoiceWarning =
    profile.style === 'fluent' && mode === 'single' && !!childVoice?.accentLevel && childVoice.accentLevel !== 'none';
  const twoVoiceWarning = mode === 'two' && !!voices.child2?.accentLevel && voices.child2.accentLevel !== 'none';

  const cacheKey = (slot: VoiceSlot, text: string) => `${slot}|${voices[slot]?.voiceId ?? ''}|${text}`;

  async function speak(slot: VoiceSlot, text: string, accent: AccentLevel, rate: number): Promise<void> {
    const key = cacheKey(slot, text);
    let url = audioUrls[key];
    const speaker: Speaker = slot === 'teacher' ? 'teacher' : 'child';
    if (!url) {
      const res = await aiFetch('/api/voice/speak', {
        text,
        speaker: slot,
        voiceId: voices[slot]?.voiceId,
        accent,
      });
      if (res.status === 503) return speakWithDevice(text, speaker, slot === 'child2' ? age + 2 : age, rate);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const k = aiErrorKey(res.status, signedIn, body.error);
        throw new Error(k ? terr(k) : t('playFailed'));
      }
      url = URL.createObjectURL(await res.blob());
      setAudioUrls((prev) => ({ ...prev, [key]: url }));
    }
    await new Promise<void>((resolve) => {
      const a = new Audio(url);
      audioRef.current = a;
      a.onended = () => resolve();
      a.onerror = () => resolve();
      a.play().catch(() => resolve());
    });
  }

  function speakTurn(turn: Turn): Promise<void> {
    if (turn.kind === 'teacher') return speak('teacher', turn.line.ko, 'none', 1);
    if (turn.kind === 'child') return speak(turn.slot, turn.answer.spoken, turn.answer.accent, turn.answer.rate);
    return Promise.resolve();
  }

  /** Play from a turn on, or just one clip. `id` marks what is highlighted. */
  async function play(from: number, only = false) {
    stop();
    stopRef.current = false;
    setError(null);
    try {
      for (let i = from; i < turns.length; i++) {
        if (stopRef.current) break;
        if (turns[i].kind === 'compare') continue;
        setPlaying(`turn-${i}`);
        await speakTurn(turns[i]);
        if (only) break;
        // A beat between turns, like a real exchange.
        await new Promise((r) => setTimeout(r, 450));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('playFailed'));
    } finally {
      setPlaying(null);
    }
  }

  async function playVariant(id: string, a: Answer) {
    stop();
    stopRef.current = false;
    setError(null);
    setPlaying(id);
    try {
      await speak('child', a.spoken, a.accent, a.rate);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('playFailed'));
    } finally {
      setPlaying(null);
    }
  }

  function stop() {
    stopRef.current = true;
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setPlaying(null);
  }

  async function generate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await aiFetch('/api/voice/dialogue', { topic, name: childName, age });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const k = aiErrorKey(res.status, signedIn, body.error);
        setError(k ? terr(k) : t('generateFailed'));
        return;
      }
      const { lines: generated } = await res.json();
      setAiLines(generated);
    } catch {
      setError(t('generateFailed'));
    } finally {
      setGenerating(false);
    }
  }

  /** "shoshib 반말 ishlatdi, ikkilandi" — what the first child did differently. */
  function compareText(first: Answer): string {
    const what = (['banmal', 'grammar', 'fillers', 'accent'] as const)
      .filter((n) => first.notes.includes(n))
      .map((n) => t(`note.${n}`));
    return t('compare', { what: what.join(', ') || t('note.accent') });
  }

  const errorsLocked = profile.style === 'fluent';
  const shownErrors = errorsFor(profile.style, profile.errors);

  return (
    <div className="space-y-6">
      {/* Voices */}
      <div className={cn('grid gap-4', mode === 'two' ? 'lg:grid-cols-3 md:grid-cols-2' : 'md:grid-cols-2')}>
        <VoiceCard
          speaker="teacher"
          voice={voices.teacher}
          signedIn={signedIn}
          childName={childName}
          age={age}
          defaultAccent="none"
          onCloned={(v) => updateVoices({ ...voices, teacher: v })}
          onRemoved={() => updateVoices({ ...voices, teacher: undefined })}
        />
        <VoiceCard
          speaker="child"
          voice={voices.child}
          signedIn={signedIn}
          childName={childName}
          age={age}
          defaultAccent={mode === 'two' ? 'noticeable' : profile.accent}
          onCloned={(v) => updateVoices({ ...voices, child: v })}
          onRemoved={() => updateVoices({ ...voices, child: undefined })}
        />
        {mode === 'two' && (
          <VoiceCard
            speaker="child2"
            voice={voices.child2}
            signedIn={signedIn}
            childName={child2Name}
            age={age}
            defaultAccent="none"
            onCloned={(v) => updateVoices({ ...voices, child2: v })}
            onRemoved={() => updateVoices({ ...voices, child2: undefined })}
          />
        )}
      </div>

      {/* Mode */}
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('mode')}>
        {(['single', 'two'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors',
              mode === m
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            {m === 'single' ? <Baby className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {m === 'single' ? t('modeSingle') : t('modeTwo')}
          </button>
        ))}
      </div>

      {/* The child */}
      <Card className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {mode === 'two' ? t('child1Name') : t('childName')}
            </span>
            <input
              value={childName}
              onChange={(e) => setChildName(e.target.value.slice(0, 20))}
              lang="ko"
              className={selectClass}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('childNameHint')}</span>
          </label>
          {mode === 'two' && (
            <label className="block text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('child2Name')}</span>
              <input
                value={child2Name}
                onChange={(e) => setChild2Name(e.target.value.slice(0, 20))}
                lang="ko"
                className={selectClass}
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">{t('age', { age })}</span>
            <input
              type="range"
              min={6}
              max={14}
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="mt-3 w-full accent-indigo-600"
            />
          </label>
        </div>

        {mode === 'single' ? (
          <>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('level')}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t('level')}>
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => applyLevel(l)}
                    aria-pressed={level === l}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm border transition-colors',
                      level === l
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                  >
                    {t(LEVEL_KEYS[l])}
                  </button>
                ))}
                {level === null && (
                  <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">{t('levelCustom')}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('levelHint')}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <fieldset className="text-sm">
                <legend className="font-medium text-gray-700 dark:text-gray-300 mb-2">{t('answerStyle')}</legend>
                <div className="space-y-1.5">
                  {ANSWER_STYLES.map((st, n) => (
                    <label key={st} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <input
                        type="radio"
                        name="answer-style"
                        className="mt-1"
                        checked={profile.style === st}
                        onChange={() => editProfile({ style: st })}
                      />
                      <span>
                        {n + 1}. <span lang="ko">{t(STYLE_KEYS[st])}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-4 text-sm">
                <label className="block">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{t('accentLevel')}</span>
                  <select
                    value={errorsLocked ? 'none' : profile.accent}
                    disabled={errorsLocked}
                    onChange={(e) => editProfile({ accent: e.target.value as AccentLevel })}
                    className={cn(selectClass, 'disabled:opacity-60')}
                  >
                    {ACCENT_LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {accentLabel(l)}
                      </option>
                    ))}
                  </select>
                </label>
                <fieldset disabled={errorsLocked} className="disabled:opacity-60">
                  <legend className="font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('errorsTitle')}</legend>
                  {(['banmal', 'grammar', 'fillers'] as const).map((k) => (
                    <label key={k} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <input type="checkbox" checked={shownErrors[k]} onChange={() => toggleError(k)} />
                      <span lang="ko">{t(`err.${k}`)}</span>
                    </label>
                  ))}
                  {errorsLocked && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('errorsLocked')}</p>
                  )}
                </fieldset>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">{t('modeTwoHint')}</p>
        )}

        {(fluentVoiceWarning || twoVoiceWarning) && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-300"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            {t('fluentVoiceWarning')}
          </p>
        )}
      </Card>

      {/* Lesson */}
      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setScenarioId(s.id);
                setAiLines(null);
              }}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm border transition-colors',
                !aiLines && s.id === scenarioId
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              {s.title} · <span lang="ko">{s.ko}</span>
              {age < s.minAge && <span className="ml-1 text-xs opacity-70">{s.minAge}+</span>}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value.slice(0, 120))}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
            placeholder={t('topicPlaceholder')}
            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white"
          />
          <Button
            variant="outline"
            onClick={generate}
            loading={generating}
            disabled={!topic.trim()}
            icon={<Sparkles className="w-4 h-4" />}
          >
            {t('generate')}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {playing !== null ? (
            <Button variant="danger" onClick={stop} icon={<Pause className="w-4 h-4" />}>
              {t('stopPlay')}
            </Button>
          ) : (
            <Button onClick={() => play(0)} icon={<Play className="w-4 h-4" />}>
              {t('playAll')}
            </Button>
          )}
          {mode === 'single' && (
            <Button
              variant={showVariants ? 'secondary' : 'outline'}
              onClick={() => setShowVariants((v) => !v)}
              icon={<Layers className="w-4 h-4" />}
              aria-pressed={showVariants}
            >
              {showVariants ? t('hideVariants') : t('variants')}
            </Button>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 ml-auto">
            <input type="checkbox" checked={showAccented} onChange={(e) => setShowAccented(e.target.checked)} />
            {t('showAccented')}
          </label>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <ol className="space-y-3">
          {turns.map((turn, i) => {
            if (turn.kind === 'compare') {
              return (
                <li key={i} className="flex justify-center">
                  <p className="max-w-[90%] text-center text-sm rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-2 text-gray-700 dark:text-gray-300">
                    💡 {compareText(turn.first)}
                  </p>
                </li>
              );
            }
            const isTeacher = turn.kind === 'teacher';
            const slot: VoiceSlot = isTeacher ? 'teacher' : turn.slot;
            const text = isTeacher ? turn.line.ko : turn.answer.said;
            const spokenText = isTeacher ? turn.line.ko : turn.answer.spoken;
            const url = audioUrls[cacheKey(slot, spokenText)];
            const fluent = !isTeacher && turn.answer.notes.includes('fluent');
            const gloss = fluent ? turn.line.fluentUz || turn.line.uz : turn.line.uz;
            return (
              <li key={i} className={cn('flex', isTeacher ? 'justify-start' : 'justify-end')}>
                <div
                  className={cn(
                    'max-w-[85%] min-w-0 rounded-2xl px-4 py-3 border transition-shadow',
                    isTeacher
                      ? 'bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50'
                      : slot === 'child2'
                        ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/50'
                        : 'bg-sky-50 border-sky-100 dark:bg-sky-950/30 dark:border-sky-900/50',
                    playing === `turn-${i}` && 'ring-2 ring-indigo-500'
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {isTeacher ? t('teacher') : turn.name || t('child')}
                    {!isTeacher && (
                      <span className="rounded-full bg-white/70 dark:bg-gray-900/60 px-2 py-0.5">
                        {fluent ? t('styleFluent') : accentLabel(turn.answer.accent)}
                      </span>
                    )}
                    <button
                      onClick={() => play(i, true)}
                      className="p-1 rounded-md hover:bg-white/70 dark:hover:bg-gray-800"
                      aria-label={t('playLine', { n: i + 1 })}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    {url && (
                      <a
                        href={url}
                        download={`${String(i + 1).padStart(2, '0')}-${slot}.mp3`}
                        className="p-1 rounded-md hover:bg-white/70 dark:hover:bg-gray-800"
                        aria-label={t('downloadLine', { n: i + 1 })}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <p lang="ko" className="text-gray-900 dark:text-white">
                    {text}
                  </p>
                  {!isTeacher && turn.answer.notes.some((n) => n === 'banmal' || n === 'selfCorrect' || n === 'grammar') && (
                    <p lang="ko" className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                      ✓ {t('correctForm', { text: turn.answer.correct })}
                    </p>
                  )}
                  {showAccented && !isTeacher && turn.answer.spoken !== turn.answer.said && (
                    <p lang="ko" className="text-sm text-sky-700 dark:text-sky-300 mt-1">
                      🔊 {turn.answer.spoken}
                    </p>
                  )}
                  {gloss && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{gloss}</p>}

                  {showVariants && mode === 'single' && !isTeacher && (
                    <ul className="mt-3 space-y-1.5 border-t border-sky-100 dark:border-sky-900/50 pt-2">
                      {ANSWER_STYLES.map((st, n) => {
                        const v = renderAnswer(turn.line, { ...singleOpts, style: st, force: true });
                        const id = `variant-${i}-${st}`;
                        return (
                          <li key={st} className="flex items-start gap-2 text-sm">
                            <button
                              onClick={() => playVariant(id, v)}
                              className={cn(
                                'p-1 rounded-md hover:bg-white/70 dark:hover:bg-gray-800 shrink-0',
                                playing === id && 'ring-2 ring-indigo-500'
                              )}
                              aria-label={t('playVariant', { style: t(STYLE_KEYS[st]) })}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="min-w-0">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {n + 1}. <span lang="ko">{t(STYLE_KEYS[st])}</span>
                              </span>
                              <span lang="ko" className="block text-gray-900 dark:text-white">
                                {v.said}
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <p className="text-xs text-gray-500 dark:text-gray-400">{t('privacyNote')}</p>
    </div>
  );
}
