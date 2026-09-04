'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { printDocument, exportToWord } from '@/lib/utils';
import { TextTranslator } from '@/components/TextTranslator';
import { GuidancePanel } from './GuidancePanel';
import { GuidanceIntro } from './GuidanceIntro';
import type { CoverLetterSectionType } from '@/lib/coverLetterGuidance';
import { loadNarrative, hasNarrativeDraft, type WhyKoreaNarrative } from '@/lib/whyKorea';
import { loadProfile, profileToPrompt } from '@/lib/profile';
import { saveDocument, loadDocument, NotSignedInError } from '@/lib/documents';
import { useAuth } from '@/lib/useAuth';
import { Toast, type ToastData } from '@/components/ui/Toast';
import {
  Sparkles,
  Download,
  FileType,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Building2,
  Target,
  Plus,
  Trash2,
  MapPin,
  AlertTriangle,
  Save,
} from 'lucide-react';

// A section's guidance/help follows its TYPE, not its position, so renaming a
// section never orphans its help copy. Custom sections use the 'custom' type.
type SectionType = CoverLetterSectionType;

const INTRO_DISMISSED_KEY = 'cl-intro-dismissed';

interface CLSection {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  charLimit: number;
}

const DEFAULT_LIMIT = 800;

// Korean example prompts, keyed by section type (kept as example content, not UI chrome).
const PLACEHOLDERS: Partial<Record<SectionType, string>> = {
  growth: '어린 시절부터 현재까지의 성장 과정을 구체적인 경험과 함께 작성하세요...',
  personality: '자신의 성격적 장점과 단점을 솔직하게 작성하세요...',
  motivation: '해당 기업과 직무에 지원하게 된 구체적인 이유를 작성하세요...',
  aspiration: '입사 후 이루고 싶은 목표와 회사에 기여하고 싶은 방향을 작성하세요...',
};

function newId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export function CoverLetterBuilder() {
  const t = useTranslations('coverLetter');
  const tc = useTranslations('common');
  const td = useTranslations('documents');
  const locale = useLocale();
  const [toast, setToast] = useState<ToastData | null>(null);
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  // Pasted target job posting — the AI tailors each section to it.
  const [jobPosting, setJobPosting] = useState('');

  // Saved-document state. documentId is kept so a second save updates the same
  // row instead of creating a duplicate.
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const { status: authStatus } = useAuth();

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await saveDocument({
        id: documentId,
        kind: 'cover_letter',
        title: company.trim() || position.trim() || td('untitled'),
        company,
        data: { company, position, jobPosting, sections },
      });
      setDocumentId(saved.id);
      setToast({ type: 'success', message: td('saved') });
    } catch (err) {
      const message = err instanceof NotSignedInError ? td('signInToSave') : td('saveError');
      if (!(err instanceof NotSignedInError)) console.error('save cover letter failed:', err);
      setToast({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  }
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const [sections, setSections] = useState<CLSection[]>(() => [
    { id: newId(), type: 'growth', title: t('sections.growth'), content: '', charLimit: DEFAULT_LIMIT },
    { id: newId(), type: 'personality', title: t('sections.personality'), content: '', charLimit: DEFAULT_LIMIT },
    { id: newId(), type: 'motivation', title: t('sections.motivation'), content: '', charLimit: DEFAULT_LIMIT },
    { id: newId(), type: 'aspiration', title: t('sections.aspiration'), content: '', charLimit: DEFAULT_LIMIT },
  ]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [narrative, setNarrative] = useState<WhyKoreaNarrative | null>(null);

  // Load the profile-level "Why Korea" narrative for the 지원동기 helpers.
  useEffect(() => {
    setNarrative(loadNarrative());
  }, []);

  // Reopening a saved cover letter: /cover-letter?doc=<id>. Waiting for the auth
  // status matters — Row Level Security returns nothing until the session is
  // restored from storage.
  useEffect(() => {
    if (authStatus === 'loading') return;
    const id = new URLSearchParams(window.location.search).get('doc');
    if (!id) return;

    if (authStatus !== 'authenticated') {
      setToast({ type: 'error', message: td('signInToOpen') });
      return;
    }

    let active = true;
    setLoadingDoc(true);
    loadDocument(id)
      .then((doc) => {
        if (!active) return;
        if (!doc || doc.kind !== 'cover_letter') {
          setToast({ type: 'error', message: td('notFound') });
          return;
        }
        const d = doc.data as Record<string, unknown>;
        if (typeof d.company === 'string') setCompany(d.company);
        if (typeof d.position === 'string') setPosition(d.position);
        if (typeof d.jobPosting === 'string') setJobPosting(d.jobPosting);
        if (Array.isArray(d.sections) && d.sections.length > 0) {
          setSections(d.sections as CLSection[]);
        }
        setDocumentId(doc.id);
        setToast({ type: 'success', message: td('opened') });
      })
      .catch((err) => {
        console.error('open cover letter failed:', err);
        if (active) setToast({ type: 'error', message: td('loadError') });
      })
      .finally(() => {
        if (active) setLoadingDoc(false);
      });

    return () => {
      active = false;
    };
  }, [authStatus, td]);

  function insertWhyKorea(sectionId: string, content: string) {
    const add = narrative?.draftText.trim();
    if (!add) return;
    updateSection(sectionId, { content: content ? `${content}\n\n${add}` : add });
  }

  // Show the "Before you write" intro on first visit unless dismissed. Skipped
  // when reopening a saved letter — the user is continuing, not starting.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('doc')) return;
    try {
      if (localStorage.getItem(INTRO_DISMISSED_KEY) !== 'true') setShowIntro(true);
    } catch { /* ignore */ }
  }, []);

  function closeIntro(dontShowAgain: boolean) {
    if (dontShowAgain) {
      try { localStorage.setItem(INTRO_DISMISSED_KEY, 'true'); } catch { /* ignore */ }
    }
    setShowIntro(false);
  }

  function updateSection(id: string, patch: Partial<CLSection>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addSection() {
    const id = newId();
    setSections((prev) => [...prev, { id, type: 'custom', title: t('newSectionTitle'), content: '', charLimit: DEFAULT_LIMIT }]);
    setExpandedId(id);
  }

  function removeSection(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
    setExpandedId((cur) => (cur === id ? null : cur));
  }

  // Real AI assist: tailors THIS section to the pasted job posting using the
  // applicant's own material. Never fabricates a personal history — with no
  // material it returns a tailored outline plus questions to answer.
  async function handleAISuggest(section: CLSection) {
    setAiLoading(section.id);
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionType: section.type,
          sectionTitle: section.title,
          company,
          position,
          jobPosting,
          content: section.content,
          // Saved career profile — real, applicant-supplied facts the AI may use.
          profile: profileToPrompt(loadProfile()),
          charLimit: section.charLimit,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.text) {
        setToast({ type: 'error', message: data?.error || t('ai.error') });
        return;
      }
      updateSection(section.id, { content: data.text });
      if (data.outline) setToast({ type: 'success', message: t('ai.outlineApplied') });
    } catch (err) {
      console.error('AI tailor failed:', err);
      setToast({ type: 'error', message: t('ai.error') });
    } finally {
      setAiLoading(null);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      if (!showPreview) setShowPreview(true);
      await new Promise((r) => setTimeout(r, 100));
      // Text-based export: keeps the text selectable and ATS-readable.
      printDocument('cover-letter-preview', `cover-letter-${company || 'koreer'}`);
      setToast({ type: 'success', message: tc('toast.printHint') });
    } catch (err) {
      console.error('PDF export failed:', err);
      setToast({ type: 'error', message: tc('toast.pdfError') });
    } finally {
      setExporting(false);
    }
  }

  function handleExportWord() {
    try {
      if (!showPreview) setShowPreview(true);
      exportToWord('cover-letter-preview', `cover-letter-${company || 'koreer'}`);
      setToast({ type: 'success', message: tc('toast.wordReady') });
    } catch (err) {
      console.error('Word export failed:', err);
      setToast({ type: 'error', message: tc('toast.wordError') });
    }
  }

  const totalChars = sections.reduce((sum, s) => sum + s.content.length, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Editor */}
      <div className="w-full lg:w-[520px] flex-shrink-0 space-y-4">
        {/* Editing an existing saved document — makes it obvious that Save
            updates this copy instead of creating another one. */}
        {documentId && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
            <Save className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
              {td('editing')}
            </span>
          </div>
        )}
        {/* Actions bar */}
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex-1 text-sm text-gray-500 dark:text-gray-400">
            {t('total')}: <span className="font-medium text-gray-900 dark:text-white">{totalChars}</span> {t('characters')}
          </div>
          <Button variant="secondary" size="sm" icon={<BookOpen className="w-4 h-4" />} onClick={() => setShowIntro(true)}>
            {t('intro.reopen')}
          </Button>
          <Button variant="secondary" size="sm" icon={showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} onClick={() => setShowPreview(!showPreview)} className="lg:hidden">
            {t('preview')}
          </Button>
          <Button variant="secondary" size="sm" icon={<Save className="w-3.5 h-3.5" />} loading={saving || loadingDoc} onClick={handleSave}>{td('save')}</Button>
          <Button variant="secondary" size="sm" icon={<FileType className="w-4 h-4" />} onClick={handleExportWord}>Word</Button>
          <Button variant="primary" size="sm" icon={<Download className="w-4 h-4" />} loading={exporting} onClick={handleExport}>PDF</Button>
        </div>

        {/* Target info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" />
            {t('applicationDetails')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('targetCompany')} placeholder="Samsung, Kakao, Naver..." value={company} onChange={(e) => setCompany(e.target.value)} leftIcon={<Building2 className="w-4 h-4" />} />
            <Input label={t('targetPosition')} placeholder="Software Engineer..." value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
          <Textarea
            label={t('jobPosting.label')}
            placeholder={t('jobPosting.placeholder')}
            value={jobPosting}
            rows={4}
            onChange={(e) => setJobPosting(e.target.value)}
            className="resize-none"
          />
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {sections.map((section) => {
            const over = section.content.length > section.charLimit;
            return (
              <div key={section.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 text-left min-w-0">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', section.content ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600')} />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{section.title}</p>
                      <p className={cn('text-xs mt-0.5', over ? 'text-red-500' : 'text-gray-400 dark:text-gray-500')}>
                        {section.content.length} / {section.charLimit} {t('characters')}
                      </p>
                    </div>
                  </div>
                  {expandedId === section.id ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                </button>

                {expandedId === section.id && (
                  <div className="px-4 pb-4 space-y-3 animate-slide-down">
                    {/* Rename + char limit + remove */}
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
                      <Input label={t('sectionTitleLabel')} value={section.title} onChange={(e) => updateSection(section.id, { title: e.target.value })} />
                      <div className="flex items-end gap-2">
                        <div className="w-24">
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('charLimitLabel')}</label>
                          <input
                            type="number"
                            min={100}
                            max={5000}
                            value={section.charLimit}
                            onChange={(e) => updateSection(section.id, { charLimit: Math.max(1, Number(e.target.value) || DEFAULT_LIMIT) })}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSection(section.id)}
                          title={t('removeSection')}
                          className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Contextual guidance (follows the section TYPE) */}
                    <GuidancePanel sectionType={section.type} />

                    {/* "Why Korea" helpers — only for the 지원동기 section */}
                    {section.type === 'motivation' && (
                      hasNarrativeDraft(narrative) ? (
                        <button
                          type="button"
                          onClick={() => insertWhyKorea(section.id, section.content)}
                          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                          {t('whyKorea.insert')}
                        </button>
                      ) : (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                            {t('whyKorea.warning')}{' '}
                            <a href={`/${locale}/settings?tab=whyKorea`} className="font-semibold underline underline-offset-2">
                              {t('whyKorea.create')}
                            </a>
                          </div>
                        </div>
                      )
                    )}

                    <Textarea
                      placeholder={PLACEHOLDERS[section.type] || ''}
                      value={section.content}
                      rows={6}
                      onChange={(e) => updateSection(section.id, { content: e.target.value })}
                      className="resize-none"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={cn('text-xs', over ? 'text-red-500' : 'text-gray-400 dark:text-gray-500')}>
                        {section.content.length} / {section.charLimit}
                      </span>
                      <div className="flex items-center gap-2">
                        <TextTranslator
                          label={t('translate')}
                          title={section.title}
                          initialText={section.content}
                          defaultFrom="auto"
                          defaultTo="ko"
                          onApply={(v) => updateSection(section.id, { content: v })}
                        />
                        <Button variant="secondary" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-indigo-500" />} loading={aiLoading === section.id} onClick={() => handleAISuggest(section)}>
                          {t('aiHelp')}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add section */}
          <button
            type="button"
            onClick={addSection}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addSection')}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className={cn('flex-1 min-w-0', showPreview ? 'block' : 'hidden lg:block')}>
        <div className="sticky top-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('preview')}</h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" icon={<FileType className="w-4 h-4" />} onClick={handleExportWord}>Word</Button>
              <Button variant="ghost" size="sm" icon={<Download className="w-4 h-4" />} loading={exporting} onClick={handleExport}>PDF</Button>
            </div>
          </div>
          <div id="cover-letter-preview" className="bg-white rounded-2xl shadow-xl overflow-auto max-h-[calc(100vh-12rem)] border border-gray-200">
            <div className="p-10" style={{ fontFamily: 'Noto Sans KR, sans-serif', fontSize: '12px', lineHeight: '2', color: '#1f2937' }}>
              <div className="text-center border-b-2 border-gray-800 pb-4 mb-8">
                <h1 className="text-xl font-bold tracking-widest">자 기 소 개 서</h1>
                {(company || position) && (
                  <p className="text-sm text-gray-500 mt-1">
                    {company && `${company}`}{company && position && ' · '}{position && `${position} 지원`}
                  </p>
                )}
              </div>

              {sections.map((section) => (
                <div key={section.id} className="mb-8">
                  <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-indigo-600 rounded-full inline-block" />
                    {section.title}
                  </h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {section.content || <span className="text-gray-300 italic">내용을 입력하세요...</span>}
                  </p>
                </div>
              ))}

              <div className="mt-12 text-center text-xs text-gray-500 border-t pt-6">
                <p>위 사항은 사실과 다름이 없습니다.</p>
                <p className="mt-2">{new Date().toLocaleDateString('ko-KR')} 지원자 (서명)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showIntro && <GuidanceIntro onClose={closeIntro} />}

      <Toast toast={toast} onClose={() => setToast(null)} closeLabel={tc('close')} />
    </div>
  );
}
