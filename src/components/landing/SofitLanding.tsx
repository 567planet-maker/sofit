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

    // (nav 스크롤 그림자는 SiteHeaderShell 가 담당)

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
    // DOM 조회는 이 인스턴스(root)로 스코프 — dev Fast Refresh/StrictMode 재마운트 시
    // 전역 getElementById 가 분리된(detached) 노드를 잡아 애니메이션이 사라지는 문제 방지.
    const N = F.length
    const order = [F[N - 2], F[N - 1], ...F, F[0], F[1], F[2]]
    const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches

    let disposed = false
    let interval: number | null = null
    let resetTimer: number | null = null
    let ro: ResizeObserver | null = null
    let healTimer: number | null = null
    let onWinResize: (() => void) | null = null

    // 스트립 내용 주입 (초기 + self-heal 재주입에 공용)
    const populate = (strip: HTMLElement, dstrip: HTMLElement | null) => {
      strip.innerHTML = order.map((f) => `<span class="roll-word">${f.w}</span>`).join('')
      if (dstrip) {
        dstrip.innerHTML = order
          .map(
            (f) =>
              `<div class="design-cell"><svg viewBox="0 0 24 24">${f.i}</svg><span class="nm">${f.w}</span></div>`
          )
          .join('')
      }
    }

    const initRolling = () => {
      if (disposed) return
      const strip = root.querySelector<HTMLElement>('#rollStrip')
      const dstrip = root.querySelector<HTMLElement>('#designStrip')
      // 마크업 주입 직후 등 아직 없으면 다음 프레임에 재시도 (빈 히어로 방지)
      if (!strip) {
        requestAnimationFrame(initRolling)
        return
      }

      populate(strip, dstrip)

      const vp = strip.parentElement as HTMLElement
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
      const fit = (): boolean => {
        const h = rowH()
        if (h <= 0) return false
        vp.style.height = `${h * 5}px`
        place()
        return true
      }

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
      const tryStart = (): boolean => {
        if (disposed || started) return started
        if (!fit()) return false
        started = true
        if (!reduce) interval = window.setInterval(step, 1400)
        return true
      }

      // 측정 가능해질 때까지 rAF 로 재시도 — setInterval 과 달리 백그라운드 탭에서
      // 스로틀/조기 종료되지 않고, 다시 보이는 순간 이어서 시도된다.
      const warm = () => {
        if (disposed || started) return
        if (!tryStart()) requestAnimationFrame(warm)
      }
      fit()
      requestAnimationFrame(warm)

      // 웹폰트(CDN Pretendard) 로드 완료 → 행 높이 재측정/시작
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          if (disposed) return
          if (started) fit()
          else tryStart()
        })
      }

      // 폰트 스왑·레이아웃 변화 시 재fit (첫 단어 크기 관찰 → 높이 변경으로 인한 루프 없음)
      ro = new ResizeObserver(() => {
        if (disposed) return
        if (started) fit()
        else tryStart()
      })
      ro.observe(el(strip, 0))

      // 뷰포트 폭 변화(디자인 스트립 중앙 정렬 재계산)
      onWinResize = () => {
        if (started) fit()
        else tryStart()
      }
      window.addEventListener('resize', onWinResize)

      // self-heal: 리렌더/HMR 등으로 스트립이 비워지면(빈 히어로·정지) 즉시 재주입·재정렬.
      // 정상일 땐(자식 존재) 아무 것도 하지 않아 애니메이션과 충돌하지 않는다.
      healTimer = window.setInterval(() => {
        if (disposed) return
        if (strip.childElementCount === 0) {
          populate(strip, dstrip)
          i = 0
          fit()
        }
      }, 1500)
    }

    initRolling()

    return () => {
      disposed = true
      window.removeEventListener('scroll', revealCheck)
      if (onWinResize) window.removeEventListener('resize', onWinResize)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      if (interval) window.clearInterval(interval)
      if (resetTimer) window.clearTimeout(resetTimer)
      if (healTimer) window.clearInterval(healTimer)
      if (ro) ro.disconnect()
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
