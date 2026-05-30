'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const PAIN_POINTS = [
  {
    title: '원하는 디자인이 있어도\n어디서 맞춰야 할지 모르겠습니다.',
    desc: '제조 업체를 찾는 것부터가 막막합니다.\n어디에 문의해야 할지 몰라 시간만 흘러갑니다.',
  },
  {
    title: '견적서마다 형식도, 금액도 달라\n믿고 선택할 수가 없습니다.',
    desc: '업체마다 다른 기준으로 작성된 견적서.\n무엇을 기준으로 선택해야 할지 알 수가 없습니다.',
  },
  {
    title: '비교하려 해도 시간이 너무 걸리고\n가격은 왜 이렇게 비싼지 알 수가 없습니다.',
    desc: '여러 업체를 비교하다 보면 며칠이 지나갑니다.\n비용 구조가 불투명해 합리적인 선택이 어렵습니다.',
  },
]

function PainPointItem({
  title,
  desc,
  index,
}: {
  title: string
  desc: string
  index: number
}) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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
      { threshold: 0.3 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`flex items-center justify-between gap-8 transition-all duration-1000 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
      }`}
    >
      {index === 1 && (
        <Image
          src="/images/empathy-quote.png"
          alt="견적서"
          width={420}
          height={315}
          className="hidden shrink-0 object-contain lg:block"
        />
      )}
      <div>
        <p className="whitespace-pre-line text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.75rem]">
          {title}
        </p>
        <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-white/60 sm:text-lg">
          {desc}
        </p>
      </div>
      {index === 0 && (
        <Image
          src="/images/empathy-design1.png"
          alt="원하는 디자인"
          width={500}
          height={375}
          className="hidden shrink-0 object-contain lg:block"
        />
      )}
      {index === 2 && (
        <Image
          src="/images/empathy-compare1.png"
          alt="비교"
          width={500}
          height={375}
          className="hidden shrink-0 object-contain lg:block"
        />
      )}
    </div>
  )
}

export default function EmpathySection() {
  return (
    <section className="bg-sofit-black py-32 sm:py-48">
      <div className="mx-auto max-w-screen-xl px-4">
        <div className="space-y-32">
          {PAIN_POINTS.map(({ title, desc }, i) => (
            <PainPointItem key={i} title={title} desc={desc} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
