import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { DemoVideo } from '@/components/DemoVideo';
import {
  Sparkles,
  FileText,
  PenLine,
  Globe,
  Download,
  LayoutTemplate,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
  Shield,
  Play,
  GraduationCap,
  Briefcase,
  BookOpen,
  Clock,
  Languages,
  DollarSign,
} from 'lucide-react';
import type { Metadata } from 'next';

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });
  return {
    title: t('hero.title'),
    description: t('hero.subtitle'),
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: t('home.features.ai.title'),
      desc: t('home.features.ai.desc'),
      color: 'from-indigo-500 to-purple-500',
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      title: t('home.features.resume.title'),
      desc: t('home.features.resume.desc'),
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: <PenLine className="w-5 h-5" />,
      title: t('home.features.coverLetter.title'),
      desc: t('home.features.coverLetter.desc'),
      color: 'from-pink-500 to-rose-500',
      bg: 'bg-pink-50 dark:bg-pink-500/10',
      iconColor: 'text-pink-600 dark:text-pink-400',
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: t('home.features.multilingual.title'),
      desc: t('home.features.multilingual.desc'),
      color: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50 dark:bg-green-500/10',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      icon: <Download className="w-5 h-5" />,
      title: t('home.features.pdf.title'),
      desc: t('home.features.pdf.desc'),
      color: 'from-orange-500 to-amber-500',
      bg: 'bg-orange-50 dark:bg-orange-500/10',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      icon: <LayoutTemplate className="w-5 h-5" />,
      title: t('home.features.templates.title'),
      desc: t('home.features.templates.desc'),
      color: 'from-violet-500 to-purple-500',
      bg: 'bg-violet-50 dark:bg-violet-500/10',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
  ];

  const steps = [
    {
      number: '01',
      title: t('home.howItWorks.step1.title'),
      desc: t('home.howItWorks.step1.desc'),
      icon: <Shield className="w-6 h-6" />,
    },
    {
      number: '02',
      title: t('home.howItWorks.step2.title'),
      desc: t('home.howItWorks.step2.desc'),
      icon: <FileText className="w-6 h-6" />,
    },
    {
      number: '03',
      title: t('home.howItWorks.step3.title'),
      desc: t('home.howItWorks.step3.desc'),
      icon: <Zap className="w-6 h-6" />,
    },
  ];

  const nationalities = [
    { flag: '🇺🇿', name: 'Uzbekistan' },
    { flag: '🇰🇿', name: 'Kazakhstan' },
    { flag: '🇰🇬', name: 'Kyrgyzstan' },
    { flag: '🇲🇳', name: 'Mongolia' },
    { flag: '🇻🇳', name: 'Vietnam' },
  ];

  const advantages = [
    { icon: <Clock className="w-5 h-5" />,          title: t('home.why.advantages.formatting.title'), desc: t('home.why.advantages.formatting.desc') },
    { icon: <Shield className="w-5 h-5" />,         title: t('home.why.advantages.standard.title'),   desc: t('home.why.advantages.standard.desc') },
    { icon: <Languages className="w-5 h-5" />,      title: t('home.why.advantages.language.title'),   desc: t('home.why.advantages.language.desc') },
    { icon: <Sparkles className="w-5 h-5" />,       title: t('home.why.advantages.ai.title'),         desc: t('home.why.advantages.ai.desc') },
    { icon: <LayoutTemplate className="w-5 h-5" />, title: t('home.why.advantages.templates.title'),  desc: t('home.why.advantages.templates.desc') },
    { icon: <DollarSign className="w-5 h-5" />,     title: t('home.why.advantages.free.title'),       desc: t('home.why.advantages.free.desc') },
  ];

  const audience = [
    { icon: <GraduationCap className="w-6 h-6" />, title: t('home.who.audience.students.title'),    desc: t('home.who.audience.students.desc'),    color: 'from-indigo-500 to-blue-500' },
    { icon: <Briefcase className="w-6 h-6" />,     title: t('home.who.audience.jobSeekers.title'),  desc: t('home.who.audience.jobSeekers.desc'),  color: 'from-purple-500 to-pink-500' },
    { icon: <BookOpen className="w-6 h-6" />,      title: t('home.who.audience.researchers.title'), desc: t('home.who.audience.researchers.desc'), color: 'from-emerald-500 to-teal-500' },
    { icon: <Globe className="w-6 h-6" />,         title: t('home.who.audience.newcomers.title'),   desc: t('home.who.audience.newcomers.desc'),   color: 'from-orange-500 to-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f11]">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl" />
        </div>

        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            {t('home.hero.badge')}
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white mb-6 animate-slide-up">
            {t('home.hero.title').split(' ').map((word, i, arr) =>
              i >= arr.length - 2 ? (
                <span key={i} className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {' '}{word}
                </span>
              ) : (
                <span key={i}>{word}{' '}</span>
              )
            )}
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed animate-slide-up">
            {t('home.hero.subtitle')}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in">
            <Link
              href={`/${locale}/auth/register`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-semibold text-lg hover:bg-indigo-700 active:bg-indigo-800 transition-all duration-150 shadow-lg hover:shadow-indigo-500/30 group"
            >
              {t('home.hero.cta')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={`/${locale}/resume`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-lg hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-150"
            >
              {t('home.hero.ctaSecondary')}
            </Link>
          </div>

          {/* Trusted by */}
          <div className="animate-fade-in">
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              {t('home.hero.trustedBy')}
            </p>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {nationalities.map((n) => (
                <div
                  key={n.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400 font-medium"
                >
                  <span className="text-lg">{n.flag}</span>
                  <span>{n.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50 dark:bg-gray-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                  <span className={feature.iconColor}>{feature.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {feature.desc}
                </p>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-[0.03]`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('home.howItWorks.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-indigo-500/50 to-purple-500/50" />

            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="relative w-16 h-16 mx-auto mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    {step.icon}
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gray-900 dark:bg-white border-2 border-white dark:border-gray-900 flex items-center justify-center">
                    <span className="text-xs font-bold text-white dark:text-gray-900">
                      {i + 1}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section id="demo" className="py-24 bg-gray-50 dark:bg-gray-950/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-sm font-medium mb-6">
            <Play className="w-3.5 h-3.5" />
            {t('home.demo.badge')}
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('home.demo.title')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10">
            {t('home.demo.subtitle')}
          </p>

          {/* Per-locale demo video — drops in /public/videos/intro-<locale>.mp4.
              Until a file exists it shows a graceful placeholder. */}
          <DemoVideo locale={locale} />
        </div>
      </section>

      {/* Why Koreer / Advantages Section */}
      <section id="why" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-medium mb-4">
              <Star className="w-3.5 h-3.5" />
              {t('home.why.badge')}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('home.why.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('home.why.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advantages.map((adv, i) => (
              <div
                key={i}
                className="flex gap-4 p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  {adv.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5">{adv.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{adv.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is it for Section */}
      <section id="who" className="py-24 bg-gray-50 dark:bg-gray-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 text-sm font-medium mb-4">
              <GraduationCap className="w-3.5 h-3.5" />
              {t('home.who.badge')}
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('home.who.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('home.who.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {audience.map((a, i) => (
              <div
                key={i}
                className="relative p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${a.color} flex items-center justify-center text-white mb-4 shadow-lg`}>
                  {a.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{a.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resume Preview Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-sm font-medium mb-6">
                <Star className="w-3.5 h-3.5" />
                {t('home.templates.badge')}
              </div>
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                {t('home.templates.title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                {t('home.templates.desc')}
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  t('home.templates.points.p1'),
                  t('home.templates.points.p2'),
                  t('home.templates.points.p3'),
                  t('home.templates.points.p4'),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={`/${locale}/resume`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all duration-150 shadow-sm hover:shadow-indigo-500/20 group"
              >
                {t('home.templates.cta')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Mock resume preview */}
            <div className="relative">
              <div className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
                {/* Resume header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                    김
                  </div>
                  <div className="text-white">
                    <h3 className="text-xl font-bold">김민준 (Kim Minjun)</h3>
                    <p className="text-indigo-200 text-sm">Software Engineer</p>
                    <p className="text-indigo-200 text-xs mt-0.5">seoul@example.com · 010-1234-5678</p>
                  </div>
                </div>
                {/* Resume body */}
                <div className="p-6 space-y-4">
                  {[
                    { label: '학력 (Education)', items: ['서울대학교 컴퓨터공학과 (2020-2024)', '학점 4.2/4.5'] },
                    { label: '경력 (Experience)', items: ['카카오 인턴십 (2023.07-2023.12)', 'React, TypeScript 개발'] },
                    { label: '기술 (Skills)', items: ['JavaScript, TypeScript, React', 'Korean (TOPIK 6급)', 'English (Advanced)'] },
                  ].map((section) => (
                    <div key={section.label}>
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2 border-b border-gray-100 dark:border-gray-800 pb-1">
                        {section.label}
                      </h4>
                      {section.items.map((item) => (
                        <div key={item} className="flex items-start gap-2 mb-1">
                          <div className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                          <p className="text-xs text-gray-700 dark:text-gray-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold shadow-lg">
                ✓ Korean Standard
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative p-16 rounded-3xl overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl" />
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }} />

            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-white mb-4">
                {t('home.cta.title')}
              </h2>
              <p className="text-indigo-200 text-xl mb-8">
                {t('home.cta.subtitle')}
              </p>
              <Link
                href={`/${locale}/auth/register`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-700 font-bold text-lg hover:bg-indigo-50 transition-all duration-150 shadow-xl group"
              >
                {t('home.cta.button')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer locale={locale} />
    </div>
  );
}
