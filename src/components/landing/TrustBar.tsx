'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from '@/hooks/useInView'

const STATS = [
  { end: 50, suffix: '+', label: '검증된 파트너 공장' },
  { end: 300, suffix: '+', label: '누적 견적 프로젝트' },
  { end: 24, suffix: '시간', label: '평균 매칭 시간' },
]

function CountUp({ end, suffix, active }: { end: number; suffix: string; active: boolean }) {
  const [count, setCount] = useState(0)
  const frame = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!active) return
    const duration = 1500
    const step = end / (duration / 16)
    let current = 0
    frame.current = setInterval(() => {
      current += step
      if (current >= end) {
        setCount(end)
        clearInterval(frame.current!)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)
    return () => clearInterval(frame.current!)
  }, [active, end])

  return (
    <span className="text-6xl font-black text-sofit-blue sm:text-7xl">
      {count}
      <span className="ml-1 text-4xl sm:text-5xl">{suffix}</span>
    </span>
  )
}

export default function TrustBar() {
  const { ref, inView } = useInView(0.3)

  return (
    <section className="bg-white px-4 py-24">
      <div
        ref={ref}
        className="mx-auto grid max-w-screen-xl grid-cols-1 gap-16 text-center sm:grid-cols-3"
      >
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center gap-3 transition-all duration-700 ease-out ${
              inView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
            style={{ transitionDelay: `${i * 150}ms` }}
          >
            <CountUp end={stat.end} suffix={stat.suffix} active={inView} />
            <p className="text-base font-medium text-sofit-gray">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
