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
  SCENARIOS,
  accentify,
  loadVoices,
  saveVoices,
  scenarioLines,
  strengthForAge,
  type ClonedVoice,
  type DialogueLine,
  type Speaker,
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

function speakWithDevice(text: string, speaker: Speaker, age: number): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    const v = deviceVoice();
    if (v) u.voice = v;
    // No cloned voice: approximate a child by pitch, higher the younger.
    u.pitch = speaker === 'teacher' ? 1.1 : Math.min(2, 1.9 - (age - 6) * 0.07);
    u.rate = speaker === 'teacher' ? 0.95 : 0.85;
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

function VoiceCard({
  speaker,
  voice,
  onCloned,
  onRemoved,
  signedIn,
  childName,
}: {
  speaker: Speaker;
  voice?: ClonedVoice;
  onCloned: (v: ClonedVoice) => void;
  onRemoved: () => void;
  signedIn: boolean;
  childName: string;
}) {
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
      form.append('label', speaker === 'child' ? childName : 'teacher');
      form.append('consent', consent ? 'yes' : 'no');
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
      onCloned({ voiceId, label: speaker === 'child' ? childName : t('teacher'), createdAt: new Date().toISOString() });
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

  const Icon = speaker === 'teacher' ? GraduationCap : Baby;
  const enough = totalSeconds >= MIN_SAMPLE_SECONDS || samples.some((s) => s.seconds === 0);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            speaker === 'teacher'
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300'
              : 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {speaker === 'teacher' ? t('teacher') : t('child')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {speaker === 'teacher' ? t('teacherHint') : t('childHint')}
          </p>
        </div>
      </div>

      {voice ? (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
          <span className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <Check className="w-4 h-4" />
            {t('cloned', { name: voice.label })}
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
            <p lang={speaker === 'teacher' ? 'ko' : undefined} className="text-sm leading-relaxed rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 text-gray-800 dark:text-gray-200">
              {READ_ALOUD[speaker]}
            </p>
          </div>

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
            <span>{speaker === 'teacher' ? t('consentTeacher') : t('consentChild')}</span>
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

export function VoiceLab() {
  const t = useTranslations('voiceLab');
  const terr = useTranslations('errors');
  const { status } = useAuth();
  const signedIn = status === 'authenticated';

  const [voices, setVoices] = useState<Partial<Record<Speaker, ClonedVoice>>>({});
  const [childName, setChildName] = useState('아지즈');
  const [age, setAge] = useState(8);
  const [strength, setStrength] = useState(strengthForAge(8));
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const [aiLines, setAiLines] = useState<DialogueLine[] | null>(null);
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [showAccented, setShowAccented] = useState(false);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const stopRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => setVoices(loadVoices()), []);
  // Warm the device voice list; some browsers fill it asynchronously.
  useEffect(() => {
    window.speechSynthesis?.getVoices();
  }, []);

  function updateVoices(next: Partial<Record<Speaker, ClonedVoice>>) {
    setVoices(next);
    saveVoices(next);
  }

  const scenario = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];
  const lines = useMemo(
    () => aiLines ?? scenarioLines(scenario, childName.trim() || '아지즈', age),
    [aiLines, scenario, childName, age]
  );

  /** The text actually spoken: the child's lines carry the accent. */
  const spoken = (l: DialogueLine) => (l.speaker === 'child' ? accentify(l.ko, strength) : l.ko);
  const cacheKey = (l: DialogueLine) => `${l.speaker}|${voices[l.speaker]?.voiceId ?? ''}|${spoken(l)}`;

  async function speakLine(l: DialogueLine): Promise<void> {
    const key = cacheKey(l);
    let url = audioUrls[key];
    if (!url) {
      const res = await aiFetch('/api/voice/speak', {
        text: spoken(l),
        speaker: l.speaker,
        voiceId: voices[l.speaker]?.voiceId,
      });
      if (res.status === 503) return speakWithDevice(spoken(l), l.speaker, age);
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

  async function play(from: number, only = false) {
    stop();
    stopRef.current = false;
    setError(null);
    try {
      for (let i = from; i < lines.length; i++) {
        if (stopRef.current) break;
        setPlaying(i);
        await speakLine(lines[i]);
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

  return (
    <div className="space-y-6">
      {/* Speakers */}
      <div className="grid gap-4 md:grid-cols-2">
        <VoiceCard
          speaker="teacher"
          voice={voices.teacher}
          signedIn={signedIn}
          childName={childName}
          onCloned={(v) => updateVoices({ ...voices, teacher: v })}
          onRemoved={() => updateVoices({ ...voices, teacher: undefined })}
        />
        <VoiceCard
          speaker="child"
          voice={voices.child}
          signedIn={signedIn}
          childName={childName}
          onCloned={(v) => updateVoices({ ...voices, child: v })}
          onRemoved={() => updateVoices({ ...voices, child: undefined })}
        />
      </div>

      {/* The child */}
      <Card className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">{t('childName')}</span>
          <input
            value={childName}
            onChange={(e) => setChildName(e.target.value.slice(0, 20))}
            lang="ko"
            className="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('childNameHint')}</span>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">{t('age', { age })}</span>
          <input
            type="range"
            min={6}
            max={14}
            value={age}
            onChange={(e) => {
              const a = Number(e.target.value);
              setAge(a);
              setStrength(strengthForAge(a));
            }}
            className="mt-3 w-full accent-indigo-600"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {t('accent', { percent: Math.round(strength * 100) })}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(strength * 100)}
            onChange={(e) => setStrength(Number(e.target.value) / 100)}
            className="mt-3 w-full accent-indigo-600"
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('accentHint')}</span>
        </label>
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
          {lines.map((l, i) => {
            const url = audioUrls[cacheKey(l)];
            const isTeacher = l.speaker === 'teacher';
            return (
              <li key={i} className={cn('flex', isTeacher ? 'justify-start' : 'justify-end')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 border transition-shadow',
                    isTeacher
                      ? 'bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/50'
                      : 'bg-sky-50 border-sky-100 dark:bg-sky-950/30 dark:border-sky-900/50',
                    playing === i && 'ring-2 ring-indigo-500'
                  )}
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {isTeacher ? t('teacher') : childName || t('child')}
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
                        download={`${String(i + 1).padStart(2, '0')}-${l.speaker}.mp3`}
                        className="p-1 rounded-md hover:bg-white/70 dark:hover:bg-gray-800"
                        aria-label={t('downloadLine', { n: i + 1 })}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <p lang="ko" className="text-gray-900 dark:text-white">
                    {l.ko}
                  </p>
                  {showAccented && !isTeacher && (
                    <p lang="ko" className="text-sm text-sky-700 dark:text-sky-300 mt-1">
                      🔊 {spoken(l)}
                    </p>
                  )}
                  {l.uz && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{l.uz}</p>}
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
