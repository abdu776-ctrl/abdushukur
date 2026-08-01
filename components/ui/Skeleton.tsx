import { cn } from '@/lib/utils';

/** A single shimmering placeholder block. Compose several to mirror the shape
 *  of the content that is loading, so the layout doesn't jump or flash. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-800', className)}
    />
  );
}
