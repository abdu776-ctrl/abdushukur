'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * "See Koreer in action" demo player. Loads a per-locale video from
 * /public/videos/intro-<locale>.mp4. Until that file exists (or if it fails to
 * load) it gracefully shows the original placeholder — so the section never
 * looks broken while the videos are being produced.
 */
export function DemoVideo({ locale }: { locale: string }) {
  const t = useTranslations('home.demo');
  const [failed, setFailed] = useState(false);

  if (!failed) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video bg-black">
        <video
          className="absolute inset-0 w-full h-full object-contain bg-black"
          src={`/videos/intro-${locale}.mp4`}
          poster="/videos/intro-poster.jpg"
          controls
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  // Fallback placeholder (shown until a video file is added).
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
          <Play className="w-9 h-9 ml-1" fill="currentColor" />
        </div>
        <p className="text-lg font-semibold">{t('comingSoon')}</p>
        <p className="text-sm text-white/70 mt-1">{t('walkthrough')}</p>
      </div>
    </div>
  );
}
