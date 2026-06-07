import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.koreer.app',
  appName: 'Koreer',
  webDir: 'public',
  server: {
    url: 'https://abdushukur.vercel.app',
    cleartext: false,
  },
};

export default config;
