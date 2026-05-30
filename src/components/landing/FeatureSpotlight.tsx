'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useInView } from '@/hooks/useInView'

interface Props {
  tag: string
  headline: string
  body: string
  ctaLabel: string
  ctaHref: string
  /** public/images/ 경로의 목업 이미지 — 제공 시 채워넣기 */
  imageSrc?: string
  imagePlaceholderLabel: string
  reversed?: boolean
  dark?: boolean
}

export default function FeatureSpotlight({
  tag,
  headline,
  body,
  ctaLabel,
  ctaHref,
  imageSrc,
  imagePlaceholderLabel,
  reversed = false,
  dark = false,
}: Props) {
  const { ref, inView } = useInView(0.12)

  const textColors = dark
    ? { heading: 'text-white', body: 'text-gray-400', tag: 'text-sofit-blue' }
    : { heading: 'text-sofit-ink', body: 'text-sofit-gray', tag: 'text-sofit-blue' }

  const bg = dark ? 'bg-sofit-navy' : reversed ? 'bg-sofit-feature' : 'bg-white'

  const textSlide = inView
    ? 'translate-x-0 opacity-100'
    : reversed
      ? 'translate-x-10 opacity-0'
      : '-translate-x-10 opacity-0'

  const imageSlide = inView
    ? 'translate-x-0 opacity-100'
    : reversed
      ? '-translate-x-10 opacity-0'
      : 'translate-x-10 opacity-0'

  const textBlock = (
    <div
      className={`flex flex-1 flex-col justify-center transition-all duration-700 ease-out ${textSlide}`}
    >
      <p className={`mb-4 text-sm font-semibold tracking-widest uppercase ${textColors.tag}`}>
        {tag}
      </p>
      <h2
        className={`whitespace-pre-line text-4xl font-bold leading-tight sm:text-5xl ${textColors.heading}`}
      >
        {headline}
      </h2>
      <p className={`mt-6 text-lg leading-relaxed ${textColors.body}`}>{body}</p>
      <Link
        href={ctaHref}
        className={`mt-8 self-start rounded-full px-6 py-3 text-sm font-semibold transition-colors ${
          dark
            ? 'border border-white/30 text-white hover:bg-white/10'
            : 'bg-sofit-blue text-white hover:bg-sofit-blue-hover'
        }`}
      >
        {ctaLabel} →
      </Link>
    </div>
  )

  const imageBlock = (
    <div
      className={`flex flex-1 items-center justify-center transition-all delay-150 duration-700 ease-out ${imageSlide}`}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={imagePlaceholderLabel}
          width={560}
          height={420}
          className="w-full max-w-lg rounded-2xl shadow-2xl"
        />
      ) : (
        /* 목업 이미지 플레이스홀더 — imageSrc prop으로 교체 */
        <div
          className={`flex h-72 w-full max-w-lg items-center justify-center rounded-2xl border-2 border-dashed sm:h-96 ${
            dark ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <p className={`text-sm ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
            {imagePlaceholderLabel}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <section className={`${bg} px-4 py-24 sm:py-32`}>
      <div
        ref={ref}
        className={`mx-auto flex max-w-screen-xl flex-col gap-16 lg:flex-row lg:items-center ${
          reversed ? 'lg:flex-row-reverse' : ''
        }`}
      >
        {textBlock}
        {imageBlock}
      </div>
    </section>
  )
}
