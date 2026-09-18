# Tests

End-to-end tests that drive a real browser against a real production build.

```bash
npm test          # build, then run
npm run test:only # run against the build already in .next
```

The first run on a new machine needs a browser:

```bash
npx playwright install chromium
```

If the machine already has a Chromium that Playwright did not install — a
sandbox image, for instance — point at it instead:

```bash
PLAYWRIGHT_CHROMIUM_PATH=/path/to/chromium npm run test:only
```

## What is covered, and why

Not coverage for its own sake. Each test stands for something that has actually
gone wrong here, or a promise the app makes that nobody would notice breaking
until someone lost work.

| Test | Guards against |
| --- | --- |
| every locale renders | A page served in the wrong language, or a locale that stops building |
| offline fallback | A blank error screen when the signal drops — which is also what gets a wrapper rejected from Play |
| cached page opens offline | The offline story being cosmetic rather than real |
| nothing from /api is cached | An account or an AI answer written to disk by the service worker |
| typing survives a reload | The draft net silently coming undone |
| typing survives a language switch | A bug this project has already had once |
| fill from the career profile | A button that looks like a feature and does nothing — also already had once |
| it never overwrites what you typed | The fill turning into data loss |
| delete buttons say what they delete | Five icon-only buttons a screen reader cannot tell apart |

## What is not covered

Anything needing an account, the database or an AI key: signing in, saving to
the cloud, AI suggestions, PDF export. Those need credentials, cost money per
run, or depend on a provider being up, so they stay manual for now.

## No test runner was added

`node:test` ships with Node and `playwright` was already a devDependency, so
this suite costs the project no new packages.
