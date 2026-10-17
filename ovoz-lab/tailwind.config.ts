import type { Config } from 'tailwindcss';

const config: Config = {
  // Follows the device's light or dark setting; there is no toggle here.
  darkMode: 'media',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
};

export default config;
