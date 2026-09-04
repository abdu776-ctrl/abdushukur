'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  PenLine,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth, signOutEverywhere } from '@/lib/useAuth';
import { LogOut } from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}

export function Sidebar() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  // Unified session — a user signed in through Supabase or NextAuth is shown
  // the same way.
  const { user } = useAuth();

  const userName = user?.name || user?.email?.split('@')[0] || 'Guest';
  const userEmail = user?.email || 'Not signed in';
  const userImage = user?.image;

  const navItems: NavItem[] = [
    {
      href: `/${locale}/dashboard`,
      icon: <LayoutDashboard className="w-4 h-4" />,
      label: t('nav.dashboard'),
    },
    {
      href: `/${locale}/resume`,
      icon: <FileText className="w-4 h-4" />,
      label: t('nav.resume'),
    },
    {
      href: `/${locale}/cover-letter`,
      icon: <PenLine className="w-4 h-4" />,
      label: t('nav.coverLetter'),
    },
    {
      href: `/${locale}/ai-assistant`,
      icon: <Sparkles className="w-4 h-4" />,
      label: t('nav.aiAssistant'),
      badge: 'AI',
    },
    {
      href: `/${locale}/documents`,
      icon: <FolderOpen className="w-4 h-4" />,
      label: t('nav.documents'),
    },
  ];

  const bottomItems: NavItem[] = [
    {
      href: `/${locale}/settings`,
      icon: <Settings className="w-4 h-4" />,
      label: t('nav.settings'),
    },
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full transition-all duration-300',
        'bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 border-b border-gray-200 dark:border-gray-800 px-4',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <Link href={`/${locale}`} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">Koreer</span>
          </Link>
        )}
        {collapsed && (
          <Link href={`/${locale}`}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </Link>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[4.5rem] w-6 h-6 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm hover:shadow-md transition-all z-10 text-gray-500 dark:text-gray-400"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center rounded-lg transition-all duration-150 group',
              collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
              isActive(item.href)
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            title={collapsed ? item.label : undefined}
          >
            <span className={cn(
              'shrink-0',
              isActive(item.href) ? 'text-indigo-600 dark:text-indigo-400' : ''
            )}>
              {item.icon}
            </span>
            {!collapsed && (
              <>
                <span className="text-sm font-medium flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
        {bottomItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center rounded-lg transition-all duration-150',
              collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2',
              isActive(item.href)
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
          </Link>
        ))}

        {/* User profile */}
        <div className={cn(
          'flex items-center rounded-lg p-2 mt-1',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 overflow-hidden">
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{userName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userEmail}</p>
              </div>
              {user && (
                <button
                  onClick={() => signOutEverywhere(`/${locale}`)}
                  title={t('common.logout')}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
