'use client';

import { useEffect } from 'react';

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
