'use client';

import { Sidebar } from './Sidebar';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0a0a0c]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 flex"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative flex flex-col w-64 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 h-16 px-4 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-900 dark:text-white">Koreer</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className={cn('min-h-full p-6 lg:p-8')}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
