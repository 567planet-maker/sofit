import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import EmpathySection from '@/components/landing/EmpathySection'
import FeatureSpotlight from '@/components/landing/FeatureSpotlight'
import TrustBar from '@/components/landing/TrustBar'
import { createClient } from '@/lib/supabase/server'
import type { FactoryPortfolioWithFactory } from '@/types'

export const metadata: Metadata = {
  title: '소핏 — 인테리어 발주 매칭 플랫폼',
  description:
    '검증된 공장과 직접 연결. 쇼파·빌트인 발주부터 시공 완료까지 소핏이 관리합니다. 지금 바로 무료 견적을 요청하세요.',
  openGraph: {
    title: '소핏 — 인테리어 발주 매칭 플랫폼',
    description: '검증된 공장과 직접 연결. 발주부터 시공까지 소핏이 관리합니다.',
  },
}

async function getPortfolioPreviews(): Promise<FactoryPortfolioWithFactory[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('factory_portfolios')
      .select('*, factories(id, company_name, location)')
      .limit(6)
      .order('created_at', { ascending: false })
    return (data as FactoryPortfolioWithFactory[]) ?? []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const portfolios = await getPortfolioPreviews()

  return (
    <>
      <Header />
      <main>
        {/* ── S1: Hero ── */}
        <section
          className="relative overflow-hidden bg-[#F2F7FF]" style={{ height: 'calc(100vh - 56px)' }}
        >
          {/* 3D 오브젝트 — 12개 30° 원형 배치 (데스크탑 전용) */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">

            {/* 12시 — 콘센트 */}
            <div className="absolute" style={{ left: '66%', top: '18%', marginLeft: '-140px', marginTop: '-128px' }}>
              <div className="animate-float-fast"><img src="/images/hero/outlet.png" alt="" width={280} height={255} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

            {/* 1시 — 에어컨 */}
            <div className="absolute" style={{ left: '62%', top: '77%', marginLeft: '-120px', marginTop: '-107px' }}>
              <div className="animate-float-slow"><img src="/images/hero/ac.png" alt="" width={240} height={214} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

            {/* 2시 — CCTV */}
            <div className="absolute" style={{ left: '78%', top: '27%', marginLeft: '-139px', marginTop: '-124px' }}>
              <div className="animate-float-medium"><img src="/images/hero/cctv.png" alt="" width={278} height={248} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

            {/* 2시 30분 — 창호 */}
            <div className="absolute" style={{ left: '72%', top: '35%', marginLeft: '-100px', marginTop: '-95px' }}>
              <div className="animate-float-fast"><img src="/images/hero/door.png" alt="" width={200} height={190} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

            {/* 3시 — 싱크대 */}
            <div className="absolute" style={{ left: '90%', top: '46%', marginLeft: '-173px', marginTop: '-158px' }}>
              <div className="animate-float-slow"><img src="/images/hero/cabinet.png" alt="" width={345} height={315} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

            {/* 4시 — 간판 */}
            <div className="absolute" style={{ left: '85%', top: '65%', marginLeft: '-165px', marginTop: '-132px' }}>
              <div className="animate-float-fast"><img src="/images/hero/sign.png" alt="" width={330} height={263} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

            {/* 5시 — 소파 */}
            <div className="absolute" style={{ left: '77%', top: '79%', marginLeft: '-195px', marginTop: '-158px' }}>
              <div className="animate-float-slow"><img src="/images/hero/sofa.png" alt="" width={390} height={315} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

            {/* 6시 — 조명 */}
            <div className="absolute" style={{ left: '50%', top: '80%', marginLeft: '-80px', marginTop: '-95px' }}>
              <div className="animate-float-medium"><img src="/images/hero/lamp.png" alt="" width={160} height={190} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

            {/* 7시 — 페인트 */}
            <div className="absolute" style={{ left: '26%', top: '88%', marginLeft: '-165px', marginTop: '-150px', zIndex: 2 }}>
              <div className="animate-float-fast"><img src="/images/hero/paint.png" alt="" width={360} height={327} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

            {/* 8시 — 타일 */}
            <div className="absolute" style={{ left: '15%', top: '75%', marginLeft: '-143px', marginTop: '-128px' }}>
              <div className="animate-float-slow"><img src="/images/hero/tiles.png" alt="" width={285} height={255} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

            {/* 8시 30분 — 배관 파랑 */}
            <div className="absolute" style={{ left: '26%', top: '34%', marginLeft: '-98px', marginTop: '-86px', zIndex: 2 }}>
              <div className="animate-float-medium"><img src="/images/hero/pipe-blue.png" alt="" width={195} height={172} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

            {/* 9시 — 배관 회색 */}
            <div className="absolute" style={{ left: '10%', top: '46%', marginLeft: '-162px', marginTop: '-139px' }}>
              <div className="animate-float-medium"><img src="/images/hero/pipe-gray.png" alt="" width={323} height={278} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

            {/* 10시 — 창틀 */}
            <div className="absolute" style={{ left: '15%', top: '27%', marginLeft: '-150px', marginTop: '-143px', zIndex: 1 }}>
              <div className="animate-float-fast"><img src="/images/hero/frame.png" alt="" width={300} height={285} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

            {/* 11시 — 철거 */}
            <div className="absolute" style={{ left: '36%', top: '74%', marginLeft: '-165px', marginTop: '-150px', zIndex: 1 }}>
              <div className="animate-float-slow"><img src="/images/hero/demolition.png" alt="" width={330} height={300} className="drop-shadow-[0_24px_48px_rgba(0,20,80,0.16)]" style={{ mixBlendMode: 'multiply' }} /></div>
            </div>

          </div>

          {/* 상단 흰색 페이드 오버레이 */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)' }}
          />

          {/* 중앙 텍스트 + CTA */}
          <div className="relative z-20 flex h-full flex-col items-center justify-center pb-28 pt-8 text-center" style={{ marginTop: '-2rem' }}>
            <h1 className="text-4xl font-black leading-[1.6] tracking-tighter text-sofit-ink sm:text-5xl lg:text-[3.75rem]">
              인테리어의 모든 공정
              <br />
              <span className="text-sofit-blue mr-2 font-black text-5xl sm:text-6xl lg:text-[5rem] relative top-[8px]" style={{ fontFamily: 'var(--font-noto-sans-kr)' }}>SOFIT</span>에서 쉽고 투명하게
            </h1>
            <p className="mx-auto mt-5 max-w-lg text-[1.125rem] leading-relaxed text-sofit-ink/60">
              기획부터 완공까지, 검증된 협력업체를 한 곳에서 연결합니다.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/customer/request"
                className="flex items-center gap-2.5 rounded-full bg-[#1A1A2E] px-6 py-[13px] text-[15px] font-semibold text-white shadow-lg transition-colors hover:bg-[#12121F]"
              >
                <svg width="17" height="17" viewBox="0 0 19 19" fill="none">
                  <path d="M4 2.5h7.5l4 4V16.5H4V2.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.5 2.5V6.5H15.5M6.5 9.5h6M6.5 12.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
                견적 무료로 요청하기
              </Link>
              <Link
                href="/portfolios"
                className="flex items-center gap-2.5 rounded-full bg-[#1A1A2E] px-6 py-[13px] text-[15px] font-semibold text-white shadow-lg transition-colors hover:bg-[#12121F]"
              >
                <svg width="17" height="17" viewBox="0 0 19 19" fill="none">
                  <rect x="2.5" y="2.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6"/>
                  <rect x="10.5" y="2.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6"/>
                  <rect x="2.5" y="10.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6"/>
                  <rect x="10.5" y="10.5" width="6" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.6"/>
                </svg>
                공장 포트폴리오 보기
              </Link>
            </div>
          </div>

          {/* 스크롤 인디케이터 */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-sofit-gray/50">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M6 9l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </section>

        {/* ── S2: 페인 포인트 헤드라인 ── */}
        <section className="bg-white py-24 text-center">
          <h2 className="text-4xl font-black leading-[1.5] tracking-tight text-sofit-ink sm:text-5xl">
            <span className="text-sofit-blue">인테리어 발주,</span>
            <br />
            이런 경험 있으신가요?
          </h2>
        </section>

        {/* ── S3: 공감 섹션 ── */}
        <EmpathySection />

        {/* ── S3: Feature 1 — 공장 매칭 ── */}
        <FeatureSpotlight
          tag="공장 매칭"
          headline={'검증된 공장을\n소핏이 직접 연결합니다.'}
          body="소핏 담당자가 공간 유형·예산·일정에 맞는 검증된 공장을 선별해 24시간 내 연결합니다. 직접 수소문할 필요가 없습니다."
          ctaLabel="견적 요청하기"
          ctaHref="/customer/request"
          imagePlaceholderLabel="공장 매칭 UI 목업"
        />

        {/* ── S4: Feature 2 — 견적 비교 ── */}
        <FeatureSpotlight
          tag="견적 비교"
          headline={'여러 공장 견적을\n한 화면에서 비교하세요.'}
          body="공장별 금액, 납기, 재질을 표 하나에 정리합니다. 더 이상 엑셀로 옮겨 담지 않아도 됩니다."
          ctaLabel="견적 받아보기"
          ctaHref="/customer/request"
          imagePlaceholderLabel="견적 비교 UI 목업"
          reversed
        />

        {/* ── S5: Feature 3 — 진행 관리 ── */}
        <FeatureSpotlight
          tag="진행 관리"
          headline={'납기, 품질\n소핏이 끝까지 관리합니다.'}
          body="발주 후 진행 현황을 실시간으로 확인하세요. 문제가 생기면 소핏이 공장과 직접 조율합니다."
          ctaLabel="소핏 시작하기"
          ctaHref="/customer/request"
          imagePlaceholderLabel="진행 타임라인 UI 목업"
          dark
        />

        {/* ── S6: 신뢰 지표 ── */}
        <TrustBar />

        {/* ── S7: 포트폴리오 갤러리 ── */}
        <section className="bg-sofit-surface px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold tracking-widest text-sofit-blue uppercase">
                  파트너 공장
                </p>
                <h2 className="text-3xl font-bold text-sofit-ink sm:text-4xl">
                  검증된 공장의 실제 작업 사례
                </h2>
              </div>
              <Link
                href="/portfolios"
                className="shrink-0 text-sm font-semibold text-sofit-blue hover:text-sofit-blue-hover"
              >
                전체 보기 →
              </Link>
            </div>

            {portfolios.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {portfolios.map((p) => (
                  <Link
                    key={p.id}
                    href={`/portfolios/${p.id}`}
                    className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image_url}
                        alt={p.description ?? '포트폴리오'}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-sofit-ink">
                        {p.factories?.company_name ?? '공장'}
                      </p>
                      {p.factories?.location && (
                        <p className="mt-0.5 text-sm text-sofit-gray">{p.factories.location}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
                  >
                    <div className="aspect-[4/3] animate-pulse bg-gray-100" />
                    <div className="p-4">
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
                      <div className="mt-2 h-3 w-16 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── S8: 고객 CTA ── */}
        <section className="bg-sofit-blue px-6 py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-bold text-white sm:text-5xl">
              인테리어 발주, 지금 바로 시작하세요.
            </h2>
            <p className="mt-4 text-lg text-blue-200">
              무료이며, 5분이면 견적 요청이 완료됩니다.
            </p>
            <Link
              href="/customer/request"
              className="mt-10 inline-block rounded-full bg-white px-10 py-4 text-base font-semibold text-sofit-blue shadow-lg transition-colors hover:bg-blue-50"
            >
              견적 무료로 요청하기
            </Link>
          </div>
        </section>

        {/* ── S9: 공장 파트너 모집 ── */}
        <section className="bg-sofit-black px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <p className="mb-3 text-sm font-semibold tracking-widest text-gray-500 uppercase">
                파트너 공장
              </p>
              <h2 className="text-4xl font-bold text-white sm:text-5xl">
                소핏 파트너 공장으로 합류하세요.
              </h2>
              <p className="mt-4 text-sofit-gray">
                안정적인 발주, 무료 입점, 소핏 전담 매니저와 함께 성장하세요.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  title: '안정적인 발주',
                  desc: '소핏이 검증한 고객 발주를 꾸준히 연결합니다. 영업 없이 발주처를 확보하세요.',
                },
                {
                  title: '무료 입점',
                  desc: '별도 수수료 없이 포트폴리오를 등록하고 노출됩니다. 1차 MVP 기간 무료 운영.',
                },
                {
                  title: '전담 매니저',
                  desc: '소핏 담당자가 발주부터 납품까지 함께합니다. 분쟁 조율도 소핏이 대신합니다.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-800 bg-transparent p-8 transition-colors hover:border-gray-600"
                >
                  <h3 className="mb-3 text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/login"
                className="inline-block rounded-full border border-white/25 px-8 py-4 text-sm font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/10"
              >
                공장으로 가입하기
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-gray-100 bg-white px-6 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
              <p className="text-lg font-bold text-sofit-ink">소핏 (SOFIT)</p>
              <div className="flex gap-6 text-sm text-sofit-gray">
                <Link href="/terms" className="hover:text-sofit-ink">
                  이용약관
                </Link>
                <Link href="/privacy" className="hover:text-sofit-ink">
                  개인정보처리방침
                </Link>
              </div>
              <p className="text-sm text-sofit-gray">© 2026 소핏. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
