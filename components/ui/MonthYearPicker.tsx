'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';

const MIN_YEAR = 1950;
const MAX_YEAR = 2035;

export interface MonthYearPickerProps {
  label?: string;
  /** Stored value in "YYYY-MM" format (same as a native month input). */
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  yearLabel?: string;
  monthLabel?: string;
}

const selectClass = cn(
  'w-full rounded-xl border bg-white dark:bg-gray-900 transition-all duration-150',
  'text-gray-900 dark:text-white text-sm px-3 py-2.5',
  'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
  'disabled:opacity-50 disabled:cursor-not-allowed'
);

/**
 * Year + Month dropdowns that read/write a "YYYY-MM" string, replacing the
 * native month picker (which forced users to type the year by hand).
 */
export function MonthYearPicker({
  label,
  value,
  onChange,
  disabled,
  yearLabel,
  monthLabel,
}: MonthYearPickerProps) {
  const locale = useLocale();

  const [year = '', month = ''] = (value || '').split('-');

  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let y = MAX_YEAR; y >= MIN_YEAR; y--) list.push(y);
    return list;
  }, []);

  const months = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'short' });
    return Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1).padStart(2, '0'),
      label: fmt.format(new Date(2000, i, 1)),
    }));
  }, [locale]);

  const handleYear = (y: string) => {
    onChange(y ? [y, month].filter(Boolean).join('-') : '');
  };
  const handleMonth = (m: string) => {
    if (!year) return;
    onChange(m ? `${year}-${m}` : year);
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
      <div className="grid grid-cols-2 gap-2">
        <select
          className={selectClass}
          value={year}
          disabled={disabled}
          onChange={(e) => handleYear(e.target.value)}
          aria-label={yearLabel || 'Year'}
        >
          <option value="">{yearLabel || '—'}</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={month}
          disabled={disabled || !year}
          onChange={(e) => handleMonth(e.target.value)}
          aria-label={monthLabel || 'Month'}
        >
          <option value="">{monthLabel || '—'}</option>
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
