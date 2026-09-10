import { ImageResponse } from 'next/og';

/**
 * Card shown when a Koreer link is shared — Telegram, KakaoTalk, X, anywhere.
 * There was none, so a shared link appeared as a bare line of text, which is
 * how most of this audience first meets the product.
 *
 * The text is deliberately Latin-only: ImageResponse renders with a bundled
 * font that has no Korean, Chinese or Vietnamese glyphs, so localized copy here
 * would come out as empty boxes. One card serves all six languages.
 */
export const runtime = 'nodejs';
export const alt = 'Koreer — AI career tools for Korea';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 48 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            K
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>Koreer</div>
        </div>

        <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.15, maxWidth: 900 }}>
          Build your Korean resume and cover letter
        </div>

        <div style={{ fontSize: 32, marginTop: 28, opacity: 0.85, maxWidth: 900 }}>
          AI career tools for international applicants in Korea
        </div>

        <div style={{ fontSize: 26, marginTop: 44, opacity: 0.75 }}>
          English · Korean · Uzbek · Russian · Chinese · Vietnamese
        </div>
      </div>
    ),
    size
  );
}
