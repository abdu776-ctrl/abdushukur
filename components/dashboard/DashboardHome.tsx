'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  FileText,
  PenLine,
  Sparkles,
  Plus,
  Clock,
  ChevronRight,
  Lightbulb,
  Download,
  LogIn,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

type DashboardDocument = {
  id: string;
  type: 'resume' | 'cover-letter';
  title: string;
  company: string;
  updatedAt: string;
  template: string;
};

// Demo content only — NEVER shown unless NEXT_PUBLIC_USE_MOCK_DATA === "true"
// AND the visitor is signed in. There is no persistence layer yet, so real
// signed-in users see empty/zeroed state until the data layer lands.
const MOCK_DASHBOARD_DATA: { documents: DashboardDocument[]; aiChats: number } = {
  documents: [
    { id: '1', type: 'resume', title: 'Software Engineer Resume', company: 'Samsung Electronics', updatedAt: '2 hours ago', template: 'Modern' },
    { id: '2', type: 'cover-letter', title: '자기소개서 - Kakao', company: 'Kakao Corp', updatedAt: '1 day ago', template: 'Korean Standard' },
    { id: '3', type: 'resume', title: 'Product Manager Resume', company: 'Naver', updatedAt: '3 days ago', template: 'Classic' },
  ],
  aiChats: 14,
};

function greetingPeriod(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

export function DashboardHome({ locale }: { locale: string }) {
  const t = useTranslations('dashboard');
  const { data: session, status } = useSession();
  const isSignedIn = status === 'authenticated' && !!session?.user;
  const user = session?.user;

  const useMock = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  const documents: DashboardDocument[] = isSignedIn && useMock ? MOCK_DASHBOARD_DATA.documents : [];
  const aiChats = isSignedIn && useMock ? MOCK_DASHBOARD_DATA.aiChats : 0;

  const resumeCount = documents.filter((d) => d.type === 'resume').length;
  const coverLetterCount = documents.filter((d) => d.type === 'cover-letter').length;

  const stats = [
    { label: t('stats.resumes'), value: resumeCount, icon: <FileText className="w-5 h-5" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: t('stats.coverLetters'), value: coverLetterCount, icon: <PenLine className="w-5 h-5" />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
    { label: t('stats.aiChats'), value: aiChats, icon: <Sparkles className="w-5 h-5" />, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
  ];

  const tips = [t('tips.tip1'), t('tips.tip2'), t('tips.tip3')];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isSignedIn
              ? t('greeting', { time: t(greetingPeriod()), name: user?.name || user?.email || '' })
              : t('welcomeGuest')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isSignedIn ? t('overview') : t('signInPrompt')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link href={`/${locale}/resume`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-all duration-150 shadow-sm">
              <Plus className="w-4 h-4" />
              {t('newDocument')}
            </Link>
          ) : (
            <Link href={`/${locale}/auth/login`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-all duration-150 shadow-sm">
              <LogIn className="w-4 h-4" />
              {t('signIn')}
            </Link>
          )}
        </div>
      </div>

      {/* Primary CTA — Build your resume (marketing, shown to everyone) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-6 sm:p-8">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="max-w-xl">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{t('ctaBanner.title')}</h2>
            <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">{t('ctaBanner.subtitle')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Link href={`/${locale}/resume`} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-all duration-150 shadow-lg group whitespace-nowrap">
              <FileText className="w-4 h-4" />
              {t('ctaBanner.createResume')}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href={`/${locale}/cover-letter`} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/15 text-white font-semibold hover:bg-white/25 backdrop-blur-sm transition-all duration-150 whitespace-nowrap">
              <PenLine className="w-4 h-4" />
              자기소개서
            </Link>
          </div>
        </div>
      </div>

      {/* Stats — only for signed-in users, with real (or zeroed) counts */}
      {isSignedIn && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: documents (signed in) or sign-in prompt (signed out) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          {isSignedIn ? (
            <>
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                <h2 className="font-semibold text-gray-900 dark:text-white">{t('recentDocuments.title')}</h2>
              </div>
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center px-6 py-14">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t('recentDocuments.empty')}</p>
                  <Link href={`/${locale}/resume`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    {t('quickActions.createResume')}
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${doc.type === 'resume' ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-purple-50 dark:bg-purple-500/10'}`}>
                        {doc.type === 'resume' ? <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" /> : <PenLine className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{doc.title}</p>
                          <Badge variant={doc.type === 'resume' ? 'info' : 'purple'} size="sm">{doc.template}</Badge>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {doc.updatedAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><Download className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Signed-out: the welcome + sign-in CTA lives in the page header
               above; this panel is just a distinct, muted placeholder so the
               welcome block is never rendered twice. */
            <div className="flex flex-col items-center justify-center text-center px-6 py-16">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                {t('docsAppearHere')}
              </p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('quickActions.title')}</h2>
            <div className="space-y-3">
              <Link href={`/${locale}/resume`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors"><FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white">{t('quickActions.createResume')}</p></div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" />
              </Link>
              <Link href={`/${locale}/cover-letter`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 transition-colors"><PenLine className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white">{t('quickActions.createCoverLetter')}</p></div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" />
              </Link>
              <Link href={`/${locale}/ai-assistant`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors"><Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white">{t('quickActions.askAI')}</p></div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-yellow-300" />
              <h2 className="font-semibold">{t('tips.title')}</h2>
            </div>
            <ul className="space-y-3">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-indigo-100">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">{i + 1}</div>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
