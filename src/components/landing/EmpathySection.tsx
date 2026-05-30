'use client'

import { useEffect, useRef, useState } from 'react'

const PAIN_POINTS = [
  '원하는 디자인이 있어도\n어디서 맞춰야 할지 몰르겠습니다.',
  '견적서마다 형식도, 금액도 달라\n믿고 선택할 수가 없었습니다.',
  '비교하려 해도 시간이 너무 걸리고\n가격은 왜 이렇게 비싼지 알 수가 없었습니다.',
]

export default function EmpathySection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="bg-sofit-black py-32 sm:py-48">
      <div className="mx-auto max-w-screen-xl px-4">
        <div className="space-y-16">
          {PAIN_POINTS.map((text, i) => (
            <p
              key={i}
              className={`whitespace-pre-line text-3xl font-bold leading-tight text-white transition-all duration-700 sm:text-4xl lg:text-[2.75rem] ${
                visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ transitionDelay: `${i * 250 + 200}ms` }}
            >
              {text}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}
