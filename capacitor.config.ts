import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.koreer.app',
  appName: 'Koreer',
  // Not really used while `server.url` is set — the shell loads the live site
  // rather than bundled files — but Capacitor insists the directory exists.
  webDir: 'public',
  server: {
    url: 'https://abdushukur.vercel.app',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      // Without this the app opens on a white rectangle while the first page
      // loads, which is exactly what a bare website wrapper looks like. Two
      // seconds of the app's own colour, then it hands over.
      launchShowDuration: 2000,
      launchAutoHide: true,
      // Matches `background_color` in app/manifest.ts.
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'small',
      // Matches `theme_color` in app/manifest.ts.
      spinnerColor: '#4f46e5',
      splashFullScreen: false,
      splashImmersive: false,
    },
  },
  android: {
    // The web app already draws its own loading states; letting the WebView
    // flash white between pages on top of that just looks broken.
    backgroundColor: '#ffffff',
  },
};

export default config;
