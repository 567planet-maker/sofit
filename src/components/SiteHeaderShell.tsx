'use client'

import { useEffect, useState } from 'react'
import '@/app/landing.css'

/**
 * 사이트 공통 헤더 셸 — sticky + 스크롤 시 그림자(.scrolled), 높이 variant(compact).
 * 랜딩·앱 어디서든 동일한 헤더 디자인을 쓰기 위해 랜딩 nav 스타일(landing.css)을 함께 로드한다.
 * variant 높이만 다르고(랜딩=넓게 / 앱=compact), 나머지 레이아웃·간격은 동일하다.
 */
export default function SiteHeaderShell({
  compact = false,
  children,
}: {
  compact?: boolean
  children: React.ReactNode
}) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      id="nav"
      className={`nav${compact ? ' nav-compact' : ''}${scrolled ? ' scrolled' : ''}`}
    >
      {children}
    </header>
  )
}
