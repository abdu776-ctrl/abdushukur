'use client';

// Bridge to the native Android/iOS shell, if the app is running inside one.
//
// Nothing here is an npm dependency. Capacitor injects `window.Capacitor` into
// the WebView when the app is built as a native shell, so the web build talks
// to it through that global and works unchanged in a plain browser.
//
// Why this exists: Google refuses OAuth inside an embedded WebView
// (`disallowed_useragent`). The fix is to hand the sign-in URL to the system
// browser — Custom Tabs on Android, SFSafariViewController on iOS — and let the
// app be reopened by a deep link once Google is done.

/** Deep link the native shell registers. Must also be listed in Supabase under
 *  Authentication → URL Configuration → Redirect URLs. */
export const NATIVE_AUTH_REDIRECT = 'com.koreer.app://auth/callback';

interface CapacitorBridge {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: {
    Browser?: {
      open: (options: { url: string }) => Promise<void>;
      close?: () => Promise<void>;
    };
    App?: {
      addListener: {
        (
          event: 'appUrlOpen',
          handler: (data: { url: string }) => void,
        ): Promise<PluginListener>;
        (
          event: 'backButton',
          handler: (data: { canGoBack: boolean }) => void,
        ): Promise<PluginListener>;
      };
      exitApp?: () => Promise<void>;
    };
  };
}

interface PluginListener {
  remove: () => Promise<void>;
}

function bridge(): CapacitorBridge | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { Capacitor?: CapacitorBridge }).Capacitor ?? null;
}

/** True when running inside the Capacitor native shell. */
export function isNativeApp(): boolean {
  const cap = bridge();
  return Boolean(cap?.isNativePlatform?.());
}

/**
 * True when the page is inside someone's embedded WebView — our own shell, or
 * an in-app browser like Telegram's, Instagram's or Facebook's. Google blocks
 * its OAuth flow in all of them, so the Google button has to behave
 * differently. User-agent sniffing is a heuristic, not a guarantee: it is only
 * used to show a helpful message, never to block the working sign-in paths.
 */
export function isEmbeddedWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (isNativeApp()) return true;

  const ua = navigator.userAgent;

  // Android WebView marks itself with "; wv" in the user agent.
  if (/\bwv\b/.test(ua) && /Android/.test(ua)) return true;

  // Known in-app browsers.
  if (/(FBAN|FBAV|Instagram|Telegram|Line\/|KAKAOTALK|NAVER)/i.test(ua)) return true;

  // iOS: a real browser reports Safari or a known engine token; a WKWebView
  // embedded in an app reports neither.
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  if (isIOS && !/Safari|CriOS|FxiOS|EdgiOS/.test(ua)) return true;

  return false;
}

/**
 * Open a URL outside the WebView. Uses the Capacitor Browser plugin when the
 * native shell provides it (Custom Tabs / SFSafariViewController), and falls
 * back to a normal new tab everywhere else.
 *
 * Returns false when neither route was available, so the caller can explain
 * the situation instead of silently doing nothing.
 */
export async function openExternal(url: string): Promise<boolean> {
  const browser = bridge()?.Plugins?.Browser;
  if (browser) {
    try {
      await browser.open({ url });
      return true;
    } catch (err) {
      console.error('native browser open failed:', err);
    }
  }
  if (typeof window === 'undefined') return false;
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  return Boolean(opened);
}

/** Close the in-app browser tab, if one is open. Harmless elsewhere. */
export async function closeExternal(): Promise<void> {
  try {
    await bridge()?.Plugins?.Browser?.close?.();
  } catch {
    /* nothing open */
  }
}

/**
 * Subscribe to the native shell reopening the app through a deep link.
 * Returns an unsubscribe function; a no-op outside the native shell.
 */
export function onAppUrlOpen(handler: (url: string) => void): () => void {
  const app = bridge()?.Plugins?.App;
  if (!app) return () => {};

  let remove: (() => Promise<void>) | null = null;
  let cancelled = false;

  app
    .addListener('appUrlOpen', (data) => handler(data.url))
    .then((sub) => {
      if (cancelled) void sub.remove();
      else remove = sub.remove;
    })
    .catch((err) => console.error('appUrlOpen listener failed:', err));

  return () => {
    cancelled = true;
    void remove?.();
  };
}

/**
 * Subscribe to the hardware back button. Returns an unsubscribe function; a
 * no-op outside the native shell.
 *
 * Taking this over is not optional: left alone, Android's back button closes
 * the whole app from any screen, so one stray tap in the middle of a resume
 * throws the person out of it. Google's Minimum Functionality policy names
 * that behaviour too.
 */
export function onBackButton(handler: (canGoBack: boolean) => void): () => void {
  const app = bridge()?.Plugins?.App;
  if (!app) return () => {};

  let remove: (() => Promise<void>) | null = null;
  let cancelled = false;

  app
    .addListener('backButton', (data) => handler(Boolean(data?.canGoBack)))
    .then((sub) => {
      if (cancelled) void sub.remove();
      else remove = sub.remove;
    })
    .catch((err) => console.error('backButton listener failed:', err));

  return () => {
    cancelled = true;
    void remove?.();
  };
}

/** Close the app. Only the native shell can do this; a no-op elsewhere. */
export async function exitApp(): Promise<void> {
  try {
    await bridge()?.Plugins?.App?.exitApp?.();
  } catch (err) {
    console.error('exitApp failed:', err);
  }
}
