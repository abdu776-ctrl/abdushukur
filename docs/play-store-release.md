# Releasing Koreer on Google Play

Two things in this process cannot be done from a web sandbox, and both are on
the critical path: **building the signed app bundle**, which needs Android
Studio on a real machine, and **the closed test**, which needs twelve people
and fourteen days. This is the checklist for both.

Everything else — the web app, the offline fallback, the store listing text,
the graphics — is either already done or can be prepared while the fourteen
days run.

---

## Part 1 — Building the app bundle

### What the machine needs

| | Minimum | Comfortable |
| --- | --- | --- |
| OS | Windows 10/11, or macOS 12+ | either |
| RAM | 8 GB | 16 GB |
| Free disk | 20 GB | 30 GB |

The first Gradle build downloads a lot and can take half an hour. Later builds
take a couple of minutes.

### 1. Node.js

Install the LTS build from <https://nodejs.org>. Then check it took:

```bash
node -v    # v20 or newer
npm -v
```

### 2. Git, and a copy of the project

Install Git from <https://git-scm.com>, then:

```bash
git clone https://github.com/abdu776-ctrl/abdushukur.git
cd abdushukur
git checkout claude/beautiful-wright-b1W2u
npm install
```

### 3. Android Studio

Download from <https://developer.android.com/studio> and install with the
default options. It brings its own JDK and Android SDK — nothing else to
install separately.

Open it once and let it finish downloading the SDK before going further.

### 4. Create the native project

The `android/` folder is not in this repository; it is generated. The Capacitor
packages are in `package.json`, so `npm install` has already fetched them:

```bash
npx cap add android
npx cap sync
```

If an `android/` folder from an earlier attempt is already there, skip
`cap add` and run `cap sync` on its own — it rewrites the config and the plugin
list into the existing project.

This reads `capacitor.config.ts` — app id `com.koreer.app`, name `Koreer` — and
writes the `android/` folder.

### 5. Open it in Android Studio

`File → Open` → pick the `android` folder (not the project root). Wait for
"Gradle sync finished" at the bottom. The first sync is the slow one.

### 6. Make the signing key

`Build → Generate Signed App Bundle / APK → Android App Bundle → Next →
Create new…`

Fill in:

| Field | What to put |
| --- | --- |
| Key store path | Somewhere you will not lose, e.g. `C:\keys\koreer.jks` |
| Password | A real password — write it down somewhere safe |
| Alias | `koreer` |
| Validity | Leave the default (25+ years) |
| First and Last Name / Organization | Your own name is fine |

**Back up `koreer.jks` and its passwords** — a cloud drive and one other place.

It is not quite as fatal to lose it as it used to be: with Play App Signing
(which is on by default for new apps) Google holds the real signing key, and a
lost *upload* key can be reset by request — but that takes days of waiting for
support, so treat it as something not to lose.

### 7. Build

`Build → Generate Signed App Bundle / APK → Android App Bundle`, pick the
keystore, choose **release**, Finish.

The file lands at:

```
android/app/release/app-release.aab
```

That `.aab` is what gets uploaded to Play Console.

### Rebuilding after a web change

The app loads the live site, so ordinary web changes need no rebuild at all —
they are live as soon as Vercel deploys. A rebuild is only needed when
something native changes: the icon, the app name, a Capacitor plugin, or the
version number.

```bash
git pull
npm install
npx cap sync
```

then build again in Android Studio. Bump `versionCode` in
`android/app/build.gradle` first — Play rejects a bundle whose `versionCode` is
not higher than the last one uploaded.

---

## Part 2 — The twelve testers

A personal developer account created after 13 November 2023 must run a closed
test with **at least 12 testers opted in continuously for 14 days** before it
can apply for production access.
([official rule](https://support.google.com/googleplay/android-developer/answer/14151465))

Two words in that sentence do the damage:

- **Opted in** — it is not enough to be on the list. Each person has to open the
  opt-in link and accept. Installing the app is not what is counted, but a
  tester who never installs it also never gives you feedback.
- **Continuously** — if someone opts out on day 9, the fourteen days are not
  fourteen days any more. Tell people plainly: stay in until you hear back.

### Setting it up

1. Play Console → your app → **Test and release → Testing → Closed testing**.
2. Create a track, upload `app-release.aab`.
3. **Testers** tab → create an email list, or point it at a Google Group
   (`yourgroup@googlegroups.com`). A Google Group is easier to change later.
4. Fill in the feedback email or URL — it is shown on the opt-in page.
5. Copy the **opt-in link** and send it to your testers.

### What each tester does

1. Opens the link **on their phone**, signed into the Google account that phone
   uses. A different account means it does not count.
2. Taps "Become a tester" / "Accept invite".
3. Installs Koreer from the Play link on the same page.
4. Stays opted in.

The Google account matters more than anything else here. The single most common
reason a tester "does not show up" is that they accepted with one account and
have a different one on their phone.

### Practical notes

- **Invite 16, not 12.** People drop out, mistype an address, or use the wrong
  account. Twelve is a floor, not a target.
- **Ask real users.** International students in Korea are exactly who Koreer is
  for. Their feedback during those two weeks is worth more than the requirement
  itself.
- **Avoid tester-swap groups and paid tester services.** They put your account
  at risk for something you can get honestly from classmates.
- Keep uploading updates to the closed track during the two weeks. It reads as
  an app under real development, which is the point of the rule.

### After 14 days

Play Console → **Dashboard** → apply for production access. Google reviews it;
this takes days, not minutes, and can come back with questions.

---

## Still open

`capacitor.config.ts` currently points the shell at the live site:

```ts
server: { url: 'https://abdushukur.vercel.app' }
```

That is the shape Google's Minimum Functionality policy (4.3) is written
against, so the app has to earn its place as an app:

- [x] **Offline** — a service worker serves visited pages and a translated
      offline screen instead of a blank error page. Done on the web side; it
      applies to the Android shell too, because the shell loads this origin.
- [x] **Back button** — walks back through history, and at the first screen
      asks for a second press before leaving.
- [x] **Splash screen** — configured in `capacitor.config.ts`.

All three are written and build clean, but only the offline screen can be
tested from a browser. The back button and the splash screen need a phone or an
emulator, so **check both on the first build** before uploading anything.
