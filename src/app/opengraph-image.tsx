import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '소핏 (SOFIT) — 쇼파·빌트인 발주 매칭 플랫폼'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#111111',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* 로고 */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '-2px',
            marginBottom: 24,
          }}
        >
          소핏
        </div>

        {/* 메인 카피 */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.2,
            maxWidth: 760,
            marginBottom: 32,
          }}
        >
          쇼파·빌트인 발주,
          <br />
          이제 소핏으로 한 번에.
        </div>

        {/* 서브 카피 */}
        <div
          style={{
            fontSize: 26,
            color: '#aaaaaa',
            fontWeight: 400,
          }}
        >
          검증된 공장 매칭 플랫폼
        </div>

        {/* 구분선 + URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 80,
            right: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ width: 48, height: 4, background: '#ffffff', borderRadius: 2 }} />
          <div style={{ fontSize: 20, color: '#666666' }}>sofit.vercel.app</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
