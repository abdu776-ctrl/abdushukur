# Google sign-in inside the Android app

Google refuses to run its OAuth flow inside an embedded WebView and answers with
`disallowed_useragent`. So in a Capacitor shell the sign-in URL has to be handed
to the system browser (Custom Tabs), and the app reopened by a deep link once
Google is done.

The web side of this is already implemented and needs no configuration:

| File | What it does |
| --- | --- |
| `lib/native.ts` | Detects the native shell / an in-app browser, opens URLs outside the WebView, listens for the deep link. |
| `lib/useAuth.ts` | `signInWithGoogle()` picks the right route; `completeNativeSignIn()` turns the deep link into a session. |
| `components/providers/AuthProvider.tsx` | Subscribes to the deep link and installs the session. |

None of it imports a Capacitor package. It talks to `window.Capacitor`, which
the native shell injects at runtime, so the web build stays unchanged and the
website keeps working exactly as before.

## What is left to do, on your own machine

The native project is not in this repository. These steps need Android Studio
and a JDK, so they cannot be done from a web sandbox.

### 1. Install the Capacitor packages

These are only needed to build the Android app — the website does not use them.

```bash
npm install @capacitor/core @capacitor/android @capacitor/browser @capacitor/app
npm install -D @capacitor/cli
npx cap add android
```

`capacitor.config.ts` already carries the right values:

```ts
appId: 'com.koreer.app'
server: { url: 'https://abdushukur.vercel.app' }
```

The app id and the deep-link scheme must match. If you change `appId`, change
`NATIVE_AUTH_REDIRECT` in `lib/native.ts` to match.

### 2. Register the deep link in AndroidManifest.xml

In `android/app/src/main/AndroidManifest.xml`, inside the `<activity>` element
for `MainActivity`, add a second intent filter:

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="com.koreer.app" />
</intent-filter>
```

Leave the existing `MAIN` / `LAUNCHER` filter alone.

### 3. Allow the deep link in Supabase

Dashboard → Authentication → URL Configuration → **Redirect URLs** → add:

```
com.koreer.app://auth/callback
```

Supabase only redirects to addresses on that list, so without this entry Google
will succeed and the app will never be reopened.

Nothing changes in Google Cloud Console: Google still redirects to the Supabase
callback that is already registered there.

### 4. Build and run

```bash
npm run build
npx cap sync android
npx cap open android
```

Then run on a real device from Android Studio.

## How to tell it works

1. Press **Continue with Google** in the app.
2. A Chrome Custom Tab opens — the URL bar shows `accounts.google.com`, and it is
   clearly the system browser, not the app's own WebView.
3. Pick the account. The tab closes on its own and the app returns to the
   dashboard, signed in.
4. Create a resume and press **Save**. It must save without asking you to sign
   in — that is the proof the app really holds a Supabase session, not just a
   Google one.

## If it fails

| Symptom | Cause |
| --- | --- |
| `disallowed_useragent` from Google | The URL opened inside the WebView. `@capacitor/browser` is missing from the native project, so `window.Capacitor.Plugins.Browser` is not there. |
| The browser opens but the app never comes back | The redirect URL is not on the Supabase allow-list, or the intent filter scheme does not match `appId`. |
| The app reopens but is still signed out | The deep link arrived without tokens. Check the Supabase auth logs for that attempt. |

Email and password sign-in works inside the WebView either way, so it stays as
the fallback while this is being set up.
