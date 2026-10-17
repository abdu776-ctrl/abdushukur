import type { CapacitorConfig } from '@capacitor/cli';

// The Android app is a shell around the live site, like Koreer's: every web
// change reaches the app without a rebuild. OVOZ_LAB_URL points it at the
// site's Vercel address; set it when building if the address differs.
const config: CapacitorConfig = {
  appId: 'com.ovozlab.app',
  appName: 'Ovoz Lab',
  // Unused while server.url is set, but Capacitor insists the folder exists.
  webDir: 'public',
  server: {
    url: process.env.OVOZ_LAB_URL || 'https://ovoz-lab.vercel.app',
    cleartext: false,
  },
  android: { backgroundColor: '#ffffff' },
};

export default config;
