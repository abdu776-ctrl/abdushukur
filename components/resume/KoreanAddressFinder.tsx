'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, X, Loader2 } from 'lucide-react';
import { useEscapeKey, useFocusTrap } from '@/lib/hooks';

/**
 * Korean address lookup, the way every Korean site does it: search for a road
 * or a building, pick it from the list, and the postcode and full address are
 * filled in for you.
 *
 * Why it matters here more than on a Korean site: the people using this cannot
 * spell their own Korean address. They are asked for it in a form that will be
 * read by a Korean employer, and Korea runs two address systems at once
 * (도로명주소 and 지번주소), so even a careful guess is often the wrong one.
 *
 * It is a helper, never a gate. Typing stays open at all times — someone
 * applying from abroad has no Korean address to look up, and the widget needs a
 * network the offline screen exists precisely to survive without.
 *
 * The script is Kakao's, it is free and needs no key, and it is fetched only
 * when the button is pressed. Nobody who does not use this ever contacts Kakao.
 */

const SCRIPT_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

interface PostcodeResult {
  zonecode?: string;
  roadAddress?: string;
  jibunAddress?: string;
  userSelectedType?: 'R' | 'J';
}

interface DaumPostcodeBridge {
  Postcode: new (options: {
    oncomplete: (data: PostcodeResult) => void;
    onclose?: () => void;
    width?: string;
    height?: string;
  }) => { embed: (element: HTMLElement) => void };
}

function daum(): DaumPostcodeBridge | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { daum?: DaumPostcodeBridge }).daum ?? null;
}

/** Load Kakao's script once, reusing the tag if it is already on the page. */
function loadScript(): Promise<void> {
  if (daum()?.Postcode) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('load failed')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('load failed'));
    document.head.appendChild(script);
  });
}

interface Props {
  onSelect: (address: string) => void;
}

export function KoreanAddressFinder({ onSelect }: Props) {
  const t = useTranslations('resume.personal');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEscapeKey(() => setOpen(false), open);
  const trapRef = useFocusTrap<HTMLDivElement>(open);

  async function openFinder() {
    setFailed(false);
    setLoading(true);
    try {
      await loadScript();
      setOpen(true);
    } catch {
      // Offline, blocked, or Kakao is down. Say so, and leave the field alone —
      // it was always typeable and still is.
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const node = boxRef.current;
    const bridge = daum();
    if (!node || !bridge) return;
    node.innerHTML = '';

    new bridge.Postcode({
      oncomplete: (data) => {
        // Korea runs two address systems side by side. Honour whichever the
        // person picked in the widget, and fall back to the road address,
        // which is the current official form.
        const chosen =
          (data.userSelectedType === 'J' ? data.jibunAddress : data.roadAddress) ||
          data.roadAddress ||
          data.jibunAddress ||
          '';
        // The postcode goes in front of the address rather than into a field of
        // its own: it keeps every saved résumé and every template working
        // unchanged, and it is how a Korean address is written out anyway.
        const withCode = data.zonecode ? `(${data.zonecode}) ${chosen}` : chosen;
        onSelect(withCode.trim());
        setOpen(false);
      },
      onclose: () => setOpen(false),
      width: '100%',
      height: '100%',
    }).embed(node);
  }, [open, onSelect]);

  return (
    <>
      <button
        type="button"
        onClick={openFinder}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
        {t('findAddress')}
      </button>

      {failed && (
        <p className="w-full text-xs text-amber-600 dark:text-amber-400 mt-1">
          {t('findAddressFailed')}
        </p>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label={t('findAddress')}
            className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('findAddress')}</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={tc('close')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* The widget's own interface is Korean, with an English toggle of
                its own. The hint above it is in the reader's language, because
                that is the sentence that has to land. */}
            <p className="px-5 pt-3 text-xs text-gray-500 dark:text-gray-400">{t('findAddressHint')}</p>

            <div ref={boxRef} className="h-[420px] w-full p-2" />
          </div>
        </div>
      )}
    </>
  );
}
