'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: `/${locale}#features`, label: t('nav.home') },
    { href: `/${locale}/resume`, label: t('nav.resume') },
    { href: `/${locale}/cover-letter`, label: t('nav.coverLetter') },
    { href: `/${locale}/ai-assistant`, label: t('nav.aiAssistant') },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800/80 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm group-hover:shadow-indigo-500/30 transition-shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white tracking-tight">
              Koreer
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
            <div className="hidden md:flex items-center gap-2 ml-2">
              <Link href={`/${locale}/auth/login`}>
                <Button variant="ghost" size="sm">
                  {t('auth.login.submit')}
                </Button>
              </Link>
              <Link href={`/${locale}/auth/register`}>
                <Button variant="primary" size="sm">
                  {t('home.hero.cta')}
                </Button>
              </Link>
            </div>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 animate-slide-down">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 pb-1 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <Link href={`/${locale}/auth/login`} onClick={() => setMobileOpen(false)}>
                <Button variant="outline" size="md" className="w-full">
                  {t('auth.login.submit')}
                </Button>
              </Link>
              <Link href={`/${locale}/auth/register`} onClick={() => setMobileOpen(false)}>
                <Button variant="primary" size="md" className="w-full">
                  {t('home.hero.cta')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
