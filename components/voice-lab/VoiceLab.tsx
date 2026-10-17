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
  type Gender,
  type LearnerErrors,
  type Level,
  type Speaker,
  type VoiceSlot,
  type VoiceTarget,
  type TypedLine,
  type InterviewPair,
  loadTyped,
  saveTyped,
  loadInterview,
  saveInterview,
  interviewLines,
  newPair,
} from '@/lib/voiceLab';
import { PITCH_PRESETS, shiftFile, toWav } from '@/lib/pitchShift';
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
  Wand2,
  Copy,
  MessagesSquare,
  Plus,
  ArrowUp,
  ArrowDown,
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

/** Pick a Korean voice from the device: a female one for the teacher and a
 *  girl, another one, where the device has it, for a boy. */
function deviceVoice(who: VoiceTarget): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const ko = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('ko'));
  const female = ko.filter((v) => /female|yuna|sunhi|heami|seoyeon|jimin/i.test(v.name));
  if (who === 'boy') return ko.find((v) => !female.includes(v)) ?? ko[0] ?? null;
  return female[0] ?? ko[0] ?? null;
}

/** The device's voice, pitched for a teacher, a girl or a boy of this age. */
function speakWithDevice(text: string, who: VoiceTarget, age: number, rate = 1): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    const v = deviceVoice(who);
    if (v) u.voice = v;
    // No cloned voice: approximate a child by pitch, higher the younger, and a
    // girl a little higher than a boy.
    const child = Math.min(2, 1.9 - (age - 6) * 0.07);
    u.pitch = who === 'teacher' ? 1.1 : who === 'girl' ? Math.min(2, child + 0.1) : child - 0.15;
    u.rate = who === 'teacher' ? 0.95 : 0.9 * rate;
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
  onSpeak,
  onKeep,
  findVoice,
  signedIn,
  childName,
  age,
  defaultAccent,
  gender,
  onGender,
}: {
  speaker: VoiceSlot;
  voice?: ClonedVoice;
  onCloned: (v: ClonedVoice) => void;
  onRemoved: () => void;
  /** Speak typed text in this card's voice (cloned, stock or the device's). */
  onSpeak: (text: string) => Promise<void>;
  /** Keep typed text for the end: it joins the saved list under the dialogue. */
  onKeep: (text: string) => void;
  /** A cloned voice for a change target, if the page has one. */
  findVoice: (target: VoiceTarget) => ClonedVoice | undefined;
  signedIn: boolean;
  childName: string;
  age: number;
  /** What a new child voice is set to before anyone changes it. */
  defaultAccent: AccentLevel;
  /** Children only: a boy or a girl. Held by the page, so the dialogue agrees. */
  gender?: Gender;
  onGender?: (g: Gender) => void;
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
  const [text, setText] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [kept, setKept] = useState(false);
  const [target, setTarget] = useState<VoiceTarget>(isChild ? (gender === 'boy' ? 'girl' : 'boy') : 'girl');
  const [pitch, setPitch] = useState<number>(PITCH_PRESETS[isChild ? (gender === 'boy' ? 'girl' : 'boy') : 'girl']);
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState<{ url: string; local: boolean; ext: string } | null>(null);
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
        form.append('gender', gender ?? 'boy');
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
        ...(isChild ? { accentLevel, gender: gender ?? 'boy' } : {}),
      });
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

  async function speakText() {
    if (!text.trim()) return;
    setError(null);
    setSpeaking(true);
    try {
      await onSpeak(text.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('playFailed'));
    } finally {
      setSpeaking(false);
    }
  }

  function chooseTarget(next: VoiceTarget) {
    setTarget(next);
    setPitch(PITCH_PRESETS[next]);
  }

  /**
   * Change the latest recording into the target voice. With an account, the
   * uploader's consent and a provider, it is a real voice change; otherwise
   * the pitch is shifted here in the browser, for free.
   */
  async function convert() {
    const sample = samples[samples.length - 1];
    if (!sample) return;
    setError(null);
    setConverting(true);
    if (converted) URL.revokeObjectURL(converted.url);
    setConverted(null);
    try {
      if (signedIn && consent) {
        const form = new FormData();
        form.append('audio', sample.blob, sample.name);
        form.append('target', target);
        form.append('consent', 'yes');
        const v = findVoice(target);
        if (v) form.append('voiceId', v.voiceId);
        const token = await accessToken();
        const res = await fetch('/api/voice/convert', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
        if (res.ok) {
          setConverted({ url: URL.createObjectURL(await res.blob()), local: false, ext: 'mp3' });
          return;
        }
        if (res.status !== 503) {
          const body = await res.json().catch(() => ({}));
          const key = aiErrorKey(res.status, signedIn, body.error);
          setError(key ? terr(key) : t('convertFailed'));
          return;
        }
      }
      const buffer = await shiftFile(sample.blob, pitch);
      setConverted({ url: URL.createObjectURL(toWav(buffer)), local: true, ext: 'wav' });
    } catch {
      setError(t('convertFailed'));
    } finally {
      setConverting(false);
    }
  }

  const Icon = isChild ? Baby : GraduationCap;
  const enough = totalSeconds >= MIN_SAMPLE_SECONDS || samples.some((s) => s.seconds === 0);
  const targets: VoiceTarget[] = ['teacher', 'boy', 'girl'];
  const targetLabel = (v: VoiceTarget) => t(v === 'teacher' ? 'targetTeacher' : v === 'boy' ? 'targetBoy' : 'targetGirl');
  const field =
    'mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white';

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            speaker === 'teacher'
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300'
              : gender === 'girl'
                ? 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-300'
                : 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300'
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

      {isChild && onGender && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('gender')}>
          {(['boy', 'girl'] as const).map((g) => (
            <button
              key={g}
              onClick={() => onGender(g)}
              aria-pressed={gender === g}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm border transition-colors',
                gender === g
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              {g === 'boy' ? t('genderBoy') : t('genderGirl')}
            </button>
          ))}
        </div>
      )}

      {voice ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
          <span className="flex flex-wrap items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <Check className="w-4 h-4" />
            {t('cloned', { name: voice.label })}
            {voice.gender && (
              <span className="rounded-full bg-white/70 dark:bg-gray-900/60 px-2 py-0.5 text-xs font-medium">
                {voice.gender === 'girl' ? t('genderGirl') : t('genderBoy')}
              </span>
            )}
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
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('browserVoice')}</p>
      )}

      {/* 1. The recording */}
      <section className="space-y-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t('studioAudio')}</h3>
        {!voice && (
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t('readAloud')}</p>
            <p
              lang={isChild ? undefined : 'ko'}
              className="text-sm leading-relaxed rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 text-gray-800 dark:text-gray-200"
            >
              {READ_ALOUD[isChild ? 'child' : 'teacher']}
            </p>
          </div>
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
            {!voice && (
              <li className="text-xs text-gray-500 dark:text-gray-400">
                {t('samplesTotal', { seconds: totalSeconds, min: MIN_SAMPLE_SECONDS })}
              </li>
            )}
          </ul>
        )}

        {/* Change the recording into a boy's, a girl's or the teacher's voice */}
        {samples.length > 0 && (
          <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="block text-sm flex-1 min-w-[10rem]">
                <span className="font-medium text-gray-700 dark:text-gray-300">{t('convertTo')}</span>
                <select value={target} onChange={(e) => chooseTarget(e.target.value as VoiceTarget)} className={field}>
                  {targets.map((v) => (
                    <option key={v} value={v}>
                      {targetLabel(v)}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant="outline"
                onClick={convert}
                loading={converting}
                disabled={recording}
                icon={<Wand2 className="w-4 h-4" />}
              >
                {t('convert')}
              </Button>
            </div>
            <label className="block text-xs text-gray-500 dark:text-gray-400">
              {t('pitch', { n: pitch > 0 ? `+${pitch}` : String(pitch) })}
              <input
                type="range"
                min={-6}
                max={12}
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </label>
            {converted && (
              <div className="flex items-center gap-2">
                <audio controls src={converted.url} className="h-8 flex-1 min-w-0" />
                <a
                  href={converted.url}
                  download={`${speaker}-${target}.${converted.ext}`}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label={t('downloadConverted')}
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
            {converted?.local && <p className="text-xs text-gray-500 dark:text-gray-400">{t('convertLocal')}</p>}
          </div>
        )}
      </section>

      {/* 2. Typed text, spoken in this voice */}
      <section className="space-y-2 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
        <label className="block text-sm">
          <span className="font-semibold text-gray-800 dark:text-gray-200">{t('studioText')}</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 400))}
            lang="ko"
            rows={3}
            placeholder={isChild ? '저는 우즈베키스탄에서 왔어요.' : '오늘은 무엇을 배울까요?'}
            className={field}
          />
        </label>
        <Button
          size="sm"
          onClick={speakText}
          loading={speaking}
          disabled={!text.trim()}
          icon={<Volume2 className="w-3.5 h-3.5" />}
        >
          {t('speakText')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            onKeep(text.trim());
            setKept(true);
            setTimeout(() => setKept(false), 2000);
          }}
          disabled={!text.trim()}
          icon={kept ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
          className="ml-2"
        >
          {kept ? t('keptTyped') : t('keepTyped')}
        </Button>
      </section>

      {/* 3. Cloning */}
      {!voice && (
        <>
          {isChild && (
            <label className="block text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">{t('accentLevel')}</span>
              <select
                value={accentLevel}
                onChange={(e) => setAccentLevel(e.target.value as AccentLevel)}
                className={field}
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
        </>
      )}

      <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{isChild ? t('consentChild') : t('consentTeacher')}</span>
      </label>

      {!voice &&
        (signedIn ? (
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
            <Link
              href={`/${locale}/auth/login`}
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
            >
              {t('signInToClone')}
            </Link>
          </p>
        ))}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </Card>
  );
}

// ── The page ──────────────────────────────────────────────────────────────

/** One child, two children compared, or an interview typed by hand. */
type Mode = 'single' | 'two' | 'interview';

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
  const [childGender, setChildGender] = useState<Gender>('boy');
  const [child2Gender, setChild2Gender] = useState<Gender>('girl');
  const [age, setAge] = useState(8);
  const [level, setLevel] = useState<Level | null>('intermediate');
  const [profile, setProfile] = useState<ChildProfile>(LEVEL_PRESETS.intermediate);
  const [mode, setMode] = useState<Mode>('single');
  const [pairs, setPairs] = useState<InterviewPair[]>([]);
  const [showVariants, setShowVariants] = useState(false);
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [aiLines, setAiLines] = useState<DialogueLine[] | null>(null);
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [showAccented, setShowAccented] = useState(false);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const clipsRef = useRef(new Map<string, Blob>());
  const [combining, setCombining] = useState<{ done: number; total: number } | null>(null);
  const [combined, setCombined] = useState<{ url: string; seconds: number } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [typed, setTyped] = useState<TypedLine[]>([]);
  const [typedCombining, setTypedCombining] = useState<{ done: number; total: number } | null>(null);
  const [typedCombined, setTypedCombined] = useState<{ url: string; seconds: number } | null>(null);
  const [typedError, setTypedError] = useState<string | null>(null);
  const [typedCopied, setTypedCopied] = useState(false);
  const stopRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setVoices(loadVoices());
    setTyped(loadTyped());
    setPairs(loadInterview());
  }, []);

  function updatePairs(next: InterviewPair[]) {
    setPairs(next);
    saveInterview(next);
  }
  function editPair(id: string, patch: Partial<InterviewPair>) {
    updatePairs(pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function movePair(i: number, by: -1 | 1) {
    const j = i + by;
    if (j < 0 || j >= pairs.length) return;
    const next = [...pairs];
    [next[i], next[j]] = [next[j], next[i]];
    updatePairs(next);
  }
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
    () =>
      mode === 'interview'
        ? interviewLines(pairs)
        : aiLines ?? scenarioLines(scenario, childName.trim() || '아지즈', age),
    [mode, pairs, aiLines, scenario, childName, age]
  );

  const singleOpts = { style: profile.style, accent: profile.accent, errors: profile.errors };

  const turns: Turn[] = useMemo(() => {
    const opts = { style: profile.style, accent: profile.accent, errors: profile.errors };
    const out: Turn[] = [];
    for (const line of lines) {
      if (line.speaker === 'teacher') {
        out.push({ kind: 'teacher', line });
      } else if (mode !== 'two') {
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
    profile.style === 'fluent' && mode !== 'two' && !!childVoice?.accentLevel && childVoice.accentLevel !== 'none';
  const twoVoiceWarning = mode === 'two' && !!voices.child2?.accentLevel && voices.child2.accentLevel !== 'none';

  const cacheKey = (slot: VoiceSlot, text: string) =>
    `${slot}|${voices[slot]?.voiceId ?? ''}|${slot === 'teacher' ? '' : genderOf(slot)}|${text}`;

  const genderOf = (slot: VoiceSlot): Gender => (slot === 'child2' ? child2Gender : childGender);
  const targetOf = (slot: VoiceSlot): VoiceTarget => (slot === 'teacher' ? 'teacher' : genderOf(slot));

  /** Switching boy ↔ girl also swaps a default name, but never a typed one. */
  function changeGender(slot: 'child' | 'child2', g: Gender) {
    const defaults: Record<Gender, string> = { boy: '아지즈', girl: '마디나' };
    const [name, setName, setG] =
      slot === 'child' ? [childName, setChildName, setChildGender] : [child2Name, setChild2Name, setChild2Gender];
    setG(g);
    if (name === defaults.boy || name === defaults.girl || name === '') setName(defaults[g]);
  }

  /** A cloned voice that can speak as this target, if the page holds one. */
  function findVoice(target: VoiceTarget): ClonedVoice | undefined {
    if (target === 'teacher') return voices.teacher;
    return (['child', 'child2'] as const)
      .map((slot) => ({ v: voices[slot], g: voices[slot]?.gender ?? genderOf(slot) }))
      .find((x) => x.v && x.g === target)?.v;
  }

  /**
   * One line as an audio file: a cloned or stock voice, or the free voice
   * (pitched up here for a child). Null when no file can be had, and the
   * browser voice has to say it instead — which can be heard, not saved.
   */
  async function getClip(slot: VoiceSlot, text: string, accent: AccentLevel): Promise<Blob | null> {
    const key = cacheKey(slot, text);
    const cached = clipsRef.current.get(key);
    if (cached) return cached;
    const res = await aiFetch('/api/voice/speak', {
      text,
      speaker: slot,
      voiceId: voices[slot]?.voiceId,
      accent,
      ...(slot === 'teacher' ? {} : { gender: genderOf(slot) }),
    });
    if (res.status === 503) return null;
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const k = aiErrorKey(res.status, signedIn, body.error);
      throw new Error(k ? terr(k) : t('playFailed'));
    }
    let blob = await res.blob();
    if (res.headers.get('X-Voice') === 'free' && slot !== 'teacher') {
      // The free voice is one adult woman: raise it to a child's, a girl a
      // little higher than a boy, and the younger the higher.
      const childAge = slot === 'child2' ? age + 2 : age;
      const semis = PITCH_PRESETS[genderOf(slot)] + Math.round((10 - childAge) * 0.3);
      blob = toWav(await shiftFile(blob, semis));
    }
    clipsRef.current.set(key, blob);
    const url = URL.createObjectURL(blob);
    setAudioUrls((prev) => ({ ...prev, [key]: url }));
    return blob;
  }

  async function speak(slot: VoiceSlot, text: string, accent: AccentLevel, rate: number): Promise<void> {
    const blob = await getClip(slot, text, accent);
    if (!blob) return speakWithDevice(text, targetOf(slot), slot === 'child2' ? age + 2 : age, rate);
    const url = URL.createObjectURL(blob);
    await new Promise<void>((resolve) => {
      const a = new Audio(url);
      audioRef.current = a;
      const done = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      a.onended = done;
      a.onerror = done;
      a.play().catch(done);
    });
  }

  function speakTurn(turn: Turn): Promise<void> {
    if (turn.kind === 'teacher') return speak('teacher', turn.line.ko, 'none', 1);
    if (turn.kind === 'child') return speak(turn.slot, turn.answer.spoken, turn.answer.accent, turn.answer.rate);
    return Promise.resolve();
  }

  function clipOf(turn: Turn): Promise<Blob | null> {
    if (turn.kind === 'teacher') return getClip('teacher', turn.line.ko, 'none');
    if (turn.kind === 'child') return getClip(turn.slot, turn.answer.spoken, turn.answer.accent);
    return Promise.resolve(null);
  }

  /**
   * Join clips into one recording, a short pause between them. Returns the
   * 1-based numbers of the clips that exist only as the device voice instead,
   * which cannot be captured.
   */
  async function joinClips(
    clips: Array<() => Promise<Blob | null>>,
    progress: (done: number) => void
  ): Promise<{ url: string; seconds: number } | { missing: number[] }> {
    const Ctx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    try {
      const buffers: AudioBuffer[] = [];
      const missing: number[] = [];
      for (const [k, clip] of clips.entries()) {
        const blob = await clip();
        if (!blob) missing.push(k + 1);
        else buffers.push(await ctx.decodeAudioData(await blob.arrayBuffer()));
        progress(k + 1);
      }
      if (missing.length) return { missing };
      const rate = ctx.sampleRate;
      const gap = Math.round(rate * 0.6);
      const length = buffers.reduce((n, b) => n + b.length + gap, 0);
      const out = ctx.createBuffer(1, Math.max(1, length), rate);
      const data = out.getChannelData(0);
      let at = 0;
      for (const b of buffers) {
        for (let c = 0; c < b.numberOfChannels; c++) {
          const ch = b.getChannelData(c);
          for (let i = 0; i < ch.length; i++) data[at + i] += ch[i] / b.numberOfChannels;
        }
        at += b.length + gap;
      }
      return { url: URL.createObjectURL(toWav(out)), seconds: Math.round(length / rate) };
    } finally {
      ctx.close().catch(() => {});
    }
  }

  /** The whole dialogue as one recording. Turn numbers match the text. */
  async function combine() {
    stop();
    setSaveError(null);
    if (combined) URL.revokeObjectURL(combined.url);
    setCombined(null);
    const spoken = turns.filter((turn) => turn.kind !== 'compare');
    setCombining({ done: 0, total: spoken.length });
    try {
      const result = await joinClips(
        spoken.map((turn) => () => clipOf(turn)),
        (done) => setCombining({ done, total: spoken.length })
      );
      if ('missing' in result) setSaveError(t('missingAudio', { lines: result.missing.join(', ') }));
      else setCombined(result);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('combineFailed'));
    } finally {
      setCombining(null);
    }
  }

  // ── Typed lines kept for the end ──────────────────────────────────────

  function keepTyped(slot: VoiceSlot, text: string) {
    if (!text) return;
    const next = [...typed, { id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`, slot, text }];
    setTyped(next);
    saveTyped(next);
  }
  function removeTyped(id: string) {
    const next = typed.filter((x) => x.id !== id);
    setTyped(next);
    saveTyped(next);
  }
  function clearTyped() {
    setTyped([]);
    saveTyped([]);
  }
  const slotName = (slot: VoiceSlot) =>
    slot === 'teacher'
      ? t('teacher')
      : `${slot === 'child' ? childName : child2Name} (${genderOf(slot) === 'girl' ? t('genderGirl') : t('genderBoy')})`;

  const typedText = useMemo(
    () =>
      typed.length
        ? [t('typedTitle'), '', ...typed.map((x, i) => `${i + 1}. ${slotName(x.slot)}: ${x.text}`)].join('\n') + '\n'
        : '',
    // slotName reads names and genders, listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [typed, childName, child2Name, childGender, child2Gender]
  );
  const typedUrl = useMemo(
    () => URL.createObjectURL(new Blob([typedText], { type: 'text/plain;charset=utf-8' })),
    [typedText]
  );
  useEffect(() => () => URL.revokeObjectURL(typedUrl), [typedUrl]);

  async function combineTyped() {
    stop();
    setTypedError(null);
    if (typedCombined) URL.revokeObjectURL(typedCombined.url);
    setTypedCombined(null);
    setTypedCombining({ done: 0, total: typed.length });
    try {
      const result = await joinClips(
        typed.map((x) => () => getClip(x.slot, x.text, 'none')),
        (done) => setTypedCombining({ done, total: typed.length })
      );
      if ('missing' in result) setTypedError(t('missingAudio', { lines: result.missing.join(', ') }));
      else setTypedCombined(result);
    } catch (err) {
      setTypedError(err instanceof Error ? err.message : t('combineFailed'));
    } finally {
      setTypedCombining(null);
    }
  }

  // A recording of an earlier list is not this list.
  useEffect(() => {
    setTypedCombined((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setTypedError(null);
  }, [typed]);

  /** The dialogue as plain text: who said what, the correct form, the Uzbek. */
  const transcript = useMemo(() => {
    const title =
      mode === 'interview' ? t('interviewTitle') : aiLines ? t('saveAiTitle') : `${scenario.title} · ${scenario.ko}`;
    const people = [
      t('teacher'),
      `${childName} — ${childGender === 'girl' ? t('genderGirl') : t('genderBoy')}`,
      ...(mode === 'two' ? [`${child2Name} — ${child2Gender === 'girl' ? t('genderGirl') : t('genderBoy')}`] : []),
    ];
    const out = [title, `${t('textParticipants')}: ${people.join('; ')}`, ''];
    let n = 0;
    for (const turn of turns) {
      if (turn.kind === 'compare') {
        out.push(`   💡 ${compareText(turn.first)}`, '');
        continue;
      }
      n += 1;
      if (turn.kind === 'teacher') {
        out.push(`${n}. ${t('teacher')}: ${turn.line.ko}`);
        if (turn.line.uz) out.push(`   (${turn.line.uz})`);
      } else {
        const a = turn.answer;
        out.push(`${n}. ${turn.name}: ${a.said}`);
        if (a.notes.some((x) => x === 'banmal' || x === 'selfCorrect' || x === 'grammar')) {
          out.push(`   ✓ ${t('correctForm', { text: a.correct })}`);
        }
        const gloss = a.notes.includes('fluent') ? turn.line.fluentUz || turn.line.uz : turn.line.uz;
        if (gloss) out.push(`   (${gloss})`);
      }
      out.push('');
    }
    return out.join('\n').trim() + '\n';
    // compareText reads only the translator, which is stable per locale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turns, aiLines, scenario, childName, child2Name, childGender, child2Gender, mode]);

  const transcriptUrl = useMemo(
    () => URL.createObjectURL(new Blob([transcript], { type: 'text/plain;charset=utf-8' })),
    [transcript]
  );
  useEffect(() => () => URL.revokeObjectURL(transcriptUrl), [transcriptUrl]);

  // A recording of an earlier version of the dialogue is not this dialogue.
  useEffect(() => {
    setCombined((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setSaveError(null);
  }, [turns]);

  async function copyTranscript() {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
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
          onSpeak={(text) => speak('teacher', text, 'none', 1)}
          onKeep={(text) => keepTyped('teacher', text)}
          findVoice={findVoice}
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
          gender={childGender}
          onGender={(g) => changeGender('child', g)}
          onSpeak={(text) => speak('child', text, 'none', 1)}
          onKeep={(text) => keepTyped('child', text)}
          findVoice={findVoice}
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
            gender={child2Gender}
            onGender={(g) => changeGender('child2', g)}
            onSpeak={(text) => speak('child2', text, 'none', 1)}
            onKeep={(text) => keepTyped('child2', text)}
            findVoice={findVoice}
            onCloned={(v) => updateVoices({ ...voices, child2: v })}
            onRemoved={() => updateVoices({ ...voices, child2: undefined })}
          />
        )}
      </div>

      {/* Mode */}
      <div className="flex flex-wrap gap-2" role="group" aria-label={t('mode')}>
        {(['single', 'two', 'interview'] as const).map((m) => (
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
            {m === 'single' ? (
              <Baby className="w-4 h-4" />
            ) : m === 'two' ? (
              <Users className="w-4 h-4" />
            ) : (
              <MessagesSquare className="w-4 h-4" />
            )}
            {m === 'single' ? t('modeSingle') : m === 'two' ? t('modeTwo') : t('modeInterview')}
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

        {mode !== 'two' ? (
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
        {mode === 'interview' ? (
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('interviewTitle')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('interviewHint')}</p>
            </div>
            {pairs.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">{t('interviewEmpty')}</p>}
            <ol className="space-y-3">
              {pairs.map((p, i) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                >
                  <label className="block text-sm min-w-0">
                    <span className="font-medium text-rose-700 dark:text-rose-300">
                      {t('question', { n: i + 1 })}
                    </span>
                    <textarea
                      value={p.q}
                      onChange={(e) => editPair(p.id, { q: e.target.value.slice(0, 300) })}
                      lang="ko"
                      rows={2}
                      placeholder={t('questionPlaceholder')}
                      className={selectClass}
                    />
                  </label>
                  <label className="block text-sm min-w-0">
                    <span className="font-medium text-sky-700 dark:text-sky-300">
                      {t('answer', { n: i + 1, name: childName })}
                    </span>
                    <textarea
                      value={p.a}
                      onChange={(e) => editPair(p.id, { a: e.target.value.slice(0, 300) })}
                      lang="ko"
                      rows={2}
                      placeholder={t('answerPlaceholder')}
                      className={selectClass}
                    />
                  </label>
                  <div className="flex md:flex-col gap-1 justify-end">
                    <button
                      onClick={() => movePair(i, -1)}
                      disabled={i === 0}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
                      aria-label={t('movePairUp', { n: i + 1 })}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => movePair(i, 1)}
                      disabled={i === pairs.length - 1}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
                      aria-label={t('movePairDown', { n: i + 1 })}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updatePairs(pairs.filter((x) => x.id !== p.id))}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label={t('removePair', { n: i + 1 })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
            <Button variant="outline" onClick={() => updatePairs([...pairs, newPair()])} icon={<Plus className="w-4 h-4" />}>
              {t('addPair')}
            </Button>
          </div>
        ) : (
        <>
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
        </>
        )}

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
          {mode !== 'two' && (
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
                      : genderOf(slot) === 'girl'
                        ? 'bg-fuchsia-50 border-fuchsia-100 dark:bg-fuchsia-950/30 dark:border-fuchsia-900/50'
                        : 'bg-sky-50 border-sky-100 dark:bg-sky-950/30 dark:border-sky-900/50',
                    playing === `turn-${i}` && 'ring-2 ring-indigo-500'
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {isTeacher ? t('teacher') : turn.name || t('child')}
                    {!isTeacher && (
                      <span className="rounded-full bg-white/70 dark:bg-gray-900/60 px-2 py-0.5">
                        {genderOf(slot) === 'girl' ? t('genderGirl') : t('genderBoy')}
                      </span>
                    )}
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

                  {showVariants && mode !== 'two' && !isTeacher && (
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

      {/* Save: one recording of the whole dialogue, and its text beside it */}
      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('saveTitle')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('saveHint')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <section className="space-y-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4 min-w-0">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('saveAudio')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('saveAudioHint')}</p>
            <Button onClick={combine} loading={!!combining} icon={<Layers className="w-4 h-4" />}>
              {combining ? t('combining', { done: combining.done, total: combining.total }) : t('combine')}
            </Button>
            {combined && (
              <div className="space-y-2">
                <audio controls src={combined.url} className="w-full" />
                <a
                  href={combined.url}
                  download={`koreys-dialog-${mode === 'interview' ? 'intervyu' : scenario.id}.wav`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Download className="w-4 h-4" />
                  {t('downloadAudio', { seconds: combined.seconds })}
                </a>
              </div>
            )}
            {saveError && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {saveError}
              </p>
            )}
          </section>
          <section className="space-y-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4 min-w-0">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('saveText')}</h3>
            <textarea
              readOnly
              value={transcript}
              rows={10}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-3 py-2 text-sm text-gray-900 dark:text-white"
              aria-label={t('saveText')}
            />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={copyTranscript} icon={<Check className="w-3.5 h-3.5" />}>
                {copied ? t('copied') : t('copyText')}
              </Button>
              <a
                href={transcriptUrl}
                download={`koreys-dialog-${mode === 'interview' ? 'intervyu' : scenario.id}.txt`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Download className="w-3.5 h-3.5" />
                {t('downloadText')}
              </a>
            </div>
          </section>
        </div>

        {/* Typed by hand in the voice cards: the teacher's questions, the children's answers */}
        <section className="space-y-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4 min-w-0">
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">{t('typedTitle')}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('typedHint')}</p>
          </div>
          {typed.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('typedEmpty')}</p>
          ) : (
            <>
              <ol className="space-y-1.5">
                {typed.map((x, i) => (
                  <li key={x.id} className="flex items-start gap-2 text-sm">
                    <span className="w-6 shrink-0 text-right text-gray-400 tabular-nums">{i + 1}.</span>
                    <span className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{slotName(x.slot)}</span>
                      <span lang="ko" className="block text-gray-900 dark:text-white break-words">
                        {x.text}
                      </span>
                    </span>
                    <button
                      onClick={() => {
                        stop();
                        speak(x.slot, x.text, 'none', 1).catch((err) =>
                          setTypedError(err instanceof Error ? err.message : t('playFailed'))
                        );
                      }}
                      className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label={t('playTyped', { n: i + 1 })}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeTyped(x.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label={t('removeTyped', { n: i + 1 })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={combineTyped}
                  loading={!!typedCombining}
                  icon={<Layers className="w-3.5 h-3.5" />}
                >
                  {typedCombining
                    ? t('combining', { done: typedCombining.done, total: typedCombining.total })
                    : t('combine')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(typedText);
                      setTypedCopied(true);
                      setTimeout(() => setTypedCopied(false), 2000);
                    } catch {
                      setTypedCopied(false);
                    }
                  }}
                  icon={<Copy className="w-3.5 h-3.5" />}
                >
                  {typedCopied ? t('copied') : t('copyText')}
                </Button>
                <a
                  href={typedUrl}
                  download="qolda-yozilgan-matnlar.txt"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('downloadText')}
                </a>
                <Button size="sm" variant="ghost" onClick={clearTyped} icon={<Trash2 className="w-3.5 h-3.5" />}>
                  {t('clearTyped')}
                </Button>
              </div>
              {typedCombined && (
                <div className="space-y-2">
                  <audio controls src={typedCombined.url} className="w-full" />
                  <a
                    href={typedCombined.url}
                    download="qolda-yozilgan-matnlar.wav"
                    className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    {t('downloadAudio', { seconds: typedCombined.seconds })}
                  </a>
                </div>
              )}
            </>
          )}
          {typedError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {typedError}
            </p>
          )}
        </section>
      </Card>

      <p className="text-xs text-gray-500 dark:text-gray-400">{t('privacyNote')}</p>
    </div>
  );
}
