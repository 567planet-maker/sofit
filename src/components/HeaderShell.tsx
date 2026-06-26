'use client'

import { useEffect, useState } from 'react'

export default function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur transition-shadow duration-200 ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      {children}
    </header>
  )
}
