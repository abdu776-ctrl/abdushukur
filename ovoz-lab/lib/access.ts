'use client';

// The access code, as this browser remembers it.

const KEY = 'ovoz-lab:code';

export function getCode(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function setCode(code: string): void {
  try {
    window.localStorage.setItem(KEY, code);
  } catch {
    // Storage disabled — the code works until the page closes.
  }
}
