// Shared plumbing for the end-to-end tests: one production server, one
// browser, started once for the whole run.
//
// These use node:test and the playwright library, both of which the project
// already has — node:test ships with Node, and playwright was already a
// devDependency. No test runner was added for this.

import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import pw from 'playwright';

const { chromium } = pw;

/** A port of its own, so a dev server on 3000 does not collide with a run. */
export const PORT = Number(process.env.TEST_PORT || 3100);
export const BASE = `http://localhost:${PORT}`;

export const LOCALES = ['en', 'ko', 'uz', 'ru', 'zh', 'vi'];

let server = null;
let browser = null;

async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/en`, { redirect: 'manual' });
      if (res.status < 500) return;
    } catch {
      // not listening yet
    }
    await sleep(300);
  }
  throw new Error(`server did not come up on ${BASE} within ${timeoutMs}ms`);
}

export async function startAll() {
  server = spawn('npx', ['next', 'start', '--port', String(PORT)], {
    cwd: process.cwd(),
    stdio: 'ignore',
    env: { ...process.env, NODE_ENV: 'production' },
  });
  await waitForServer();

  browser = await chromium.launch({
    // Set this when the sandbox ships a browser that does not match the
    // playwright build; otherwise playwright finds its own.
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  });
}

export async function stopAll() {
  await browser?.close();
  server?.kill('SIGTERM');
}

/**
 * A fresh context per test. Isolation matters more than usual here: almost
 * everything this app remembers — drafts, the career profile, dismissed hints —
 * lives in localStorage, so a leaked context would let one test decide another
 * one's result.
 */
export async function withPage(fn, contextOptions = {}) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ...contextOptions,
  });
  const page = await context.newPage();
  try {
    return await fn(page, context);
  } finally {
    await context.close();
  }
}

/** Open a builder past the first-run card, which otherwise covers the form. */
export async function openBuilder(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await page.evaluate(() => {
    try {
      localStorage.setItem('resume-intro-dismissed', 'true');
      localStorage.setItem('cover-letter-intro-dismissed', 'true');
    } catch {
      /* storage disabled */
    }
  });
  await page.reload({ waitUntil: 'load' });
  // Hydration: the form is server-rendered but only interactive after it.
  await page.waitForFunction(() => document.querySelectorAll('input').length > 0, null, {
    timeout: 15_000,
  });
}
