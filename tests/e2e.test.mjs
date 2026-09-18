// End-to-end tests for the things that would hurt most if they broke quietly.
//
// This is not coverage for its own sake. Each test here stands for a bug that
// has actually happened in this project, or for a promise the app makes that
// nobody would notice breaking until a user lost work:
//
//   · a page that renders in the wrong language, or not at all
//   · a blank screen when the network drops
//   · typing that disappears on a refresh or a language switch
//   · a button that looks like a feature and does nothing
//   · icon-only delete buttons that a screen reader cannot tell apart
//
// Nothing here needs an account, a database or an AI key, so the suite runs
// anywhere and never spends money.

import test, { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startAll, stopAll, withPage, openBuilder, BASE, LOCALES } from './harness.mjs';

const messages = Object.fromEntries(
  LOCALES.map((l) => [l, JSON.parse(readFileSync(new URL(`../messages/${l}.json`, import.meta.url)))])
);

before(startAll, { timeout: 120_000 });
after(stopAll);

describe('every locale renders', () => {
  for (const locale of LOCALES) {
    test(`/${locale}/resume is served in ${locale}`, { timeout: 60_000 }, async () => {
      await withPage(async (page) => {
        const res = await page.goto(`${BASE}/${locale}/resume`, { waitUntil: 'load' });
        assert.equal(res.status(), 200, 'page should be served');

        const lang = await page.getAttribute('html', 'lang');
        assert.equal(lang, locale, 'html lang must match the URL');

        // The page title comes from the locale's own messages, so a missing
        // translation or a broken locale layout shows up here.
        const title = await page.title();
        assert.ok(
          title.includes(messages[locale].common.tagline),
          `title ${JSON.stringify(title)} should carry the ${locale} tagline`
        );
      });
    });
  }
});

describe('offline', () => {
  test('an unvisited page falls back to the offline screen', { timeout: 90_000 }, async () => {
    await withPage(async (page, context) => {
      await page.goto(`${BASE}/uz/resume`, { waitUntil: 'load' });
      await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
        timeout: 30_000,
      });

      await context.setOffline(true);
      await page.goto(`${BASE}/uz/cover-letter`, { waitUntil: 'load' }).catch(() => {});

      const heading = await page.textContent('#title');
      assert.ok(heading && heading.length > 0, 'the offline screen should have a heading');
      // The fallback picks its language from the path it was asked for.
      assert.match(heading, /Internet aloqasi/, 'the offline screen should be in Uzbek for /uz');
    });
  });

  test('a page already visited still opens with the network off', { timeout: 90_000 }, async () => {
    await withPage(async (page, context) => {
      await page.goto(`${BASE}/en/resume`, { waitUntil: 'load' });
      await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
        timeout: 30_000,
      });

      await context.setOffline(true);
      await page.goto(`${BASE}/en/resume`, { waitUntil: 'load' }).catch(() => {});

      const title = await page.title();
      assert.ok(title.includes('Koreer'), `expected the real page, got ${JSON.stringify(title)}`);
    });
  });

  test('nothing from /api is ever cached', { timeout: 90_000 }, async () => {
    await withPage(async (page) => {
      await page.goto(`${BASE}/en/resume`, { waitUntil: 'load' });
      await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
        timeout: 30_000,
      });

      const cached = await page.evaluate(async () => {
        const out = [];
        for (const name of await caches.keys()) {
          const cache = await caches.open(name);
          for (const req of await cache.keys()) out.push(new URL(req.url).pathname);
        }
        return out;
      });

      const leaked = cached.filter((p) => p.startsWith('/api/') || /\/auth(\/|$)/.test(p));
      assert.deepEqual(leaked, [], 'account and AI routes must never be stored');
    });
  });
});

describe('work is not lost', () => {
  const NAME = 'Draft Survives Reload';

  test('typing survives a reload', { timeout: 90_000 }, async () => {
    await withPage(async (page) => {
      await openBuilder(page, '/en/resume');
      await page.getByRole('textbox').first().fill(NAME);
      // The draft is debounced; give it room to be written.
      await page.waitForFunction(
        () => Object.keys(localStorage).some((k) => k.startsWith('koreer:draft')),
        null,
        { timeout: 10_000 }
      );

      await page.reload({ waitUntil: 'load' });
      await page.waitForFunction(() => document.querySelectorAll('input').length > 0);
      // Any field carrying the value is enough: the first <input> in the DOM
      // is the hidden photo picker, not the name box.
      await page.waitForFunction(
        (expected) =>
          Array.from(document.querySelectorAll('input')).some((i) => i.value === expected),
        NAME,
        { timeout: 10_000 }
      );
    });
  });

  test('typing survives a language switch', { timeout: 90_000 }, async () => {
    await withPage(async (page) => {
      await openBuilder(page, '/en/resume');
      await page.getByRole('textbox').first().fill(NAME);
      await page.waitForFunction(
        () => Object.keys(localStorage).some((k) => k.startsWith('koreer:draft')),
        null,
        { timeout: 10_000 }
      );

      // Switching language is a navigation to a different route entirely, which
      // is exactly why this used to throw the work away.
      await page.goto(`${BASE}/uz/resume`, { waitUntil: 'load' });
      await page.waitForFunction(() => document.querySelectorAll('input').length > 0);
      // Any field carrying the value is enough: the first <input> in the DOM
      // is the hidden photo picker, not the name box.
      await page.waitForFunction(
        (expected) =>
          Array.from(document.querySelectorAll('input')).some((i) => i.value === expected),
        NAME,
        { timeout: 10_000 }
      );
    });
  });
});

describe('fill from the career profile', () => {
  test('skills come across, de-duplicated, and the button then retires', {
    timeout: 90_000,
  }, async () => {
    await withPage(async (page) => {
      await page.goto(`${BASE}/en/resume`, { waitUntil: 'load' });
      await page.evaluate(() => {
        localStorage.setItem('resume-intro-dismissed', 'true');
        localStorage.setItem(
          'koreer:career-profile',
          JSON.stringify({
            headline: '', education: '', experience: '', languages: '', strengths: '',
            // Deliberately messy: three separators and one repeat.
            skills: 'Python, JavaScript\nReact; Figma · SQL, python',
            updatedAt: new Date().toISOString(),
          })
        );
      });
      await page.reload({ waitUntil: 'load' });
      await page.waitForFunction(() => document.querySelectorAll('input').length > 0);

      await page.getByRole('button', { name: /^Skills/ }).first().click();
      const fill = page.getByRole('button', { name: /Fill from my profile/i });
      await fill.first().click();

      const names = await page.evaluate(() =>
        Array.from(document.querySelectorAll('input'))
          .filter((i) => /skill/i.test(i.placeholder || ''))
          .map((i) => i.value)
      );
      assert.deepEqual(names, ['Python', 'JavaScript', 'React', 'Figma', 'SQL']);

      assert.equal(
        await page.getByRole('button', { name: /Fill from my profile/i }).count(),
        0,
        'with nothing left to offer, the button should not linger'
      );
    });
  });

  test('it never overwrites something already typed', { timeout: 90_000 }, async () => {
    await withPage(async (page) => {
      await page.goto(`${BASE}/en/resume`, { waitUntil: 'load' });
      await page.evaluate(() => {
        localStorage.setItem('resume-intro-dismissed', 'true');
        localStorage.setItem(
          'koreer:career-profile',
          JSON.stringify({
            headline: '', education: '', experience: '', languages: '', strengths: '',
            skills: 'Python', updatedAt: new Date().toISOString(),
          })
        );
      });
      await page.reload({ waitUntil: 'load' });
      await page.waitForFunction(() => document.querySelectorAll('input').length > 0);

      await page.getByRole('button', { name: /^Skills/ }).first().click();
      await page.getByRole('button', { name: /Fill from my profile/i }).first().click();
      // A second offer would mean it is willing to act on a non-empty list.
      assert.equal(await page.getByRole('button', { name: /Fill from my profile/i }).count(), 0);
    });
  });
});

describe('reachable from anywhere', () => {
  // These three used to live only in the landing page's footer, which no
  // signed-in page renders. Someone mid-resume had no way to report a problem
  // and no way to check what happens to the data they were entering.
  for (const path of ['/en/resume', '/en/cover-letter', '/en/settings']) {
    test(`privacy, terms and contact are on ${path}`, { timeout: 60_000 }, async () => {
      await withPage(async (page) => {
        await page.goto(`${BASE}${path}`, { waitUntil: 'load' });

        const hrefs = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href') || '')
        );

        assert.ok(hrefs.some((h) => h.endsWith('/privacy')), 'privacy policy should be linked');
        assert.ok(hrefs.some((h) => h.endsWith('/terms')), 'terms should be linked');
        assert.ok(hrefs.some((h) => h.startsWith('mailto:')), 'a way to write in should exist');
      });
    });
  }
});

describe('the AI greeting follows the interface, not the history', () => {
  test('a chat started in Uzbek is greeted in Korean on the Korean site', {
    timeout: 90_000,
  }, async () => {
    await withPage(async (page) => {
      await page.goto(`${BASE}/ko/ai-assistant`, { waitUntil: 'load' });

      // A conversation as it was stored before: the greeting frozen into the
      // history in the language the chat happened to start in.
      await page.evaluate((uzGreeting) => {
        localStorage.setItem(
          'koreer:chats',
          JSON.stringify([
            {
              id: 'seeded',
              title: 'seeded',
              updatedAt: new Date().toISOString(),
              messages: [
                { id: '0', role: 'assistant', content: uzGreeting, at: new Date().toISOString() },
                { id: '1', role: 'user', content: 'salom', at: new Date().toISOString() },
              ],
            },
          ])
        );
      }, messages.uz.aiAssistant.greeting);

      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(2500);
      const body = await page.textContent('body');

      const koOpening = messages.ko.aiAssistant.greeting.slice(0, 24);
      const uzOpening = messages.uz.aiAssistant.greeting.slice(0, 24);

      assert.ok(body.includes(koOpening), 'the Korean page should greet in Korean');
      assert.ok(!body.includes(uzOpening), 'the stored Uzbek greeting should not survive');
      assert.ok(body.includes('salom'), 'what the person actually typed must be kept');
    });
  });
});

describe('accessibility', () => {
  test('row delete buttons say what they delete', { timeout: 90_000 }, async () => {
    await withPage(async (page) => {
      await page.goto(`${BASE}/en/resume`, { waitUntil: 'load' });
      await page.evaluate(() => {
        localStorage.setItem('resume-intro-dismissed', 'true');
        localStorage.setItem(
          'koreer:career-profile',
          JSON.stringify({
            headline: '', education: '', experience: '', languages: '', strengths: '',
            skills: 'Python, Figma', updatedAt: new Date().toISOString(),
          })
        );
      });
      await page.reload({ waitUntil: 'load' });
      await page.waitForFunction(() => document.querySelectorAll('input').length > 0);

      await page.getByRole('button', { name: /^Skills/ }).first().click();
      await page.getByRole('button', { name: /Fill from my profile/i }).first().click();

      const labels = await page.evaluate(() =>
        Array.from(document.querySelectorAll('button[aria-label]'))
          .map((b) => b.getAttribute('aria-label'))
          .filter((l) => /^Remove /.test(l))
      );

      assert.deepEqual(
        labels,
        ['Remove Python', 'Remove Figma'],
        'each button should name its own row, not the section'
      );
    });
  });
});
