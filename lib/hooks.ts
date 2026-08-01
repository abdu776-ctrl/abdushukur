'use client';

import { useEffect, useRef } from 'react';

/** Call `handler` when the Escape key is pressed while `active` is true.
 *  Used by dialogs so keyboard users can always dismiss an overlay. */
export function useEscapeKey(handler: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handler();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handler, active]);
}

/** Trap Tab focus inside the returned ref's element while `active`. Focuses the
 *  first focusable on open and restores focus to the previous element on close.
 *  Attach the returned ref to the dialog container. */
export function useFocusTrap<T extends HTMLElement>(active = true) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const node = ref.current;
    if (!active || !node) return;
    const previous = document.activeElement as HTMLElement | null;
    const selector =
      'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const focusables = () =>
      Array.from(node.querySelectorAll<HTMLElement>(selector)).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    node.addEventListener('keydown', onKey);
    return () => {
      node.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [active]);
  return ref;
}
