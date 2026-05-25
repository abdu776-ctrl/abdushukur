import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:
    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  success:
    'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400',
  warning:
    'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  danger:
    'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400',
  info:
    'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
  purple:
    'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400',
};

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
