'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import './../../app/landing.css'
import { F, MARKUP } from './sofitLandingData'

/**
 * SOFIT 랜딩 — claude.ai/design 원본을 1px 동일하게 이식.
 * 본문 마크업은 원본 HTML 그대로(dangerouslySetInnerHTML), 스타일은 landing.css,
 * 롤링 히어로 애니메이션은 아래 useEffect로 이식했습니다.
 * 헤더(nav)는 기능을 가진 서버 컴포넌트를 `header` prop으로 받아 래퍼 안에 렌더합니다.
 */
export default function SofitLanding({ header }: { header?: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // ── nav shadow on scroll ──
    const nav = document.getElementById('nav')
    const onNavScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 8)
    window.addEventListener('scroll', onNavScroll, { passive: true })

    // ── scroll reveal ──
    const revealCheck = () => {
      root.querySelectorAll<HTMLElement>('.reveal:not(.in)').forEach((e) => {
        if (e.getBoundingClientRect().top < window.innerHeight * 0.92) e.classList.add('in')
      })
    }
    revealCheck()
    window.addEventListener('scroll', revealCheck, { passive: true })
    const t1 = window.setTimeout(() => {
      revealCheck()
      document.body.classList.add('anim-ready')
    }, 80)
    const t2 = window.setTimeout(
      () => root.querySelectorAll('.reveal:not(.in)').forEach((e) => e.classList.add('in')),
      1600
    )

    // ── rolling hero: 27 fields + synced design strip ──
    const strip = document.getElementById('rollStrip')
    const dstrip = document.getElementById('designStrip')
    let resizeHandler: (() => void) | null = null
    let interval: number | null = null
    let resetTimer: number | null = null
    let warmup: number | null = null
    let disposed = false

    if (strip) {
      const vp = strip.parentElement as HTMLElement
      const N = F.length
      const order = [F[N - 2], F[N - 1], ...F, F[0], F[1], F[2]]
      strip.innerHTML = order.map((f) => `<span class="roll-word">${f.w}</span>`).join('')
      if (dstrip) {
        dstrip.innerHTML = order
          .map(
            (f) =>
              `<div class="design-cell"><svg viewBox="0 0 24 24">${f.i}</svg><span class="nm">${f.w}</span></div>`
          )
          .join('')
      }

      let i = 0
      const el = (parent: Element, idx: number) => parent.children[idx] as HTMLElement
      const rowH = () =>
        el(strip, 1).getBoundingClientRect().top - el(strip, 0).getBoundingClientRect().top
      const colW = () =>
        el(dstrip!, 1).getBoundingClientRect().left - el(dstrip!, 0).getBoundingClientRect().left
      const markMid = () => {
        const k = i + 2
        for (let j = 0; j < dstrip!.children.length; j++)
          dstrip!.children[j].classList.toggle('is-mid', j === k)
      }
      const place = () => {
        const h = rowH()
        if (h <= 0) return // 폰트 로딩 전 등 측정 불가 시 0 높이로 접히지 않도록 방어
        strip.style.transform = `translateY(${-i * h}px)`
        if (dstrip) {
          const dvp = dstrip.parentElement as HTMLElement
          dstrip.style.transform = `translateX(${
            dvp.clientWidth / 2 - el(dstrip, 0).getBoundingClientRect().width / 2 - (i + 2) * colW()
          }px)`
          markMid()
        }
      }
      const fit = () => {
        const h = rowH()
        if (h <= 0) return
        vp.style.height = `${h * 5}px`
        place()
      }

      const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches
      const step = () => {
        i++
        const tr = 'transform .55s cubic-bezier(.22,1,.36,1)'
        strip.style.transition = tr
        if (dstrip) dstrip.style.transition = tr
        place()
        if (i === N) {
          resetTimer = window.setTimeout(() => {
            strip.style.transition = 'none'
            if (dstrip) dstrip.style.transition = 'none'
            i = 0
            place()
          }, 580)
        }
      }

      // 측정이 가능해진 뒤에만 시작 — 시작 전 멈춤(폰트 비동기 로드 타이밍) 방지
      let started = false
      const start = (): boolean => {
        if (disposed) return false
        if (started) return true
        if (rowH() <= 0) return false
        started = true
        fit()
        if (!reduce) interval = window.setInterval(step, 1400)
        return true
      }

      // 페인트 직후 + 웹폰트(CDN Pretendard) 로드 완료 시점에 각각 재측정/시작
      fit()
      requestAnimationFrame(() => {
        fit()
        start()
      })
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          if (disposed) return
          fit()
          start()
        })
      }
      // 측정 가능해질 때까지 재시도, 시작되면 중단 (최대 6초)
      warmup = window.setInterval(() => {
        if (disposed) {
          if (warmup) window.clearInterval(warmup)
          return
        }
        fit()
        if (start() && warmup) {
          window.clearInterval(warmup)
          warmup = null
        }
      }, 120)
      window.setTimeout(() => {
        if (warmup) {
          window.clearInterval(warmup)
          warmup = null
        }
      }, 6000)

      resizeHandler = fit
      window.addEventListener('resize', resizeHandler)
    }

    return () => {
      disposed = true
      window.removeEventListener('scroll', onNavScroll)
      window.removeEventListener('scroll', revealCheck)
      if (resizeHandler) window.removeEventListener('resize', resizeHandler)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      if (interval) window.clearInterval(interval)
      if (resetTimer) window.clearTimeout(resetTimer)
      if (warmup) window.clearInterval(warmup)
      document.body.classList.remove('anim-ready')
    }
  }, [])

  return (
    <div className="sofit-landing" ref={rootRef}>
      {header}
      <div dangerouslySetInnerHTML={{ __html: MARKUP }} />
    </div>
  )
}
