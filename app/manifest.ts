import type { MetadataRoute } from 'next';

/**
 * Web app manifest. It lets people install Koreer to the home screen straight
 * from the browser — no app store in between — and it is also what an Android
 * wrapper reads for its name and icon.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Koreer — AI Career Assistant for Korea',
    short_name: 'Koreer',
    description:
      'Create Korean resumes (이력서) and self-introduction letters (자기소개서) with AI assistance.',
    // The middleware redirects "/" to the visitor's language.
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    categories: ['productivity', 'education', 'business'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
