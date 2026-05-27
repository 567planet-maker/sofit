import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import type { FactoryPortfolioWithFactory } from '@/types'

export const metadata: Metadata = {
  title: '소핏 — 쇼파·빌트인 발주 매칭 플랫폼',
  description:
    '전국 검증 공장과 직접 연결. 쇼파·빌트인 발주부터 시공 완료까지 소핏이 관리합니다. 지금 바로 무료 견적을 요청하세요.',
  openGraph: {
    title: '소핏 — 쇼파·빌트인 발주 매칭 플랫폼',
    description: '전국 검증 공장과 직접 연결. 발주부터 시공까지 소핏이 관리합니다.',
  },
}

const STEPS = [
  {
    number: '01',
    title: '견적 요청',
    desc: '현장 정보와 요구사항을 5분 안에 입력하세요. 사진·도면 첨부도 가능합니다.',
  },
  {
    number: '02',
    title: '공장 매칭',
    desc: '소핏 담당자가 요건에 맞는 검증 공장을 선별해 직접 연결합니다.',
  },
  {
    number: '03',
    title: '견적 비교',
    desc: '여러 공장의 견적서를 한눈에 비교하고 소핏과 소통하며 결정하세요.',
  },
  {
    number: '04',
    title: '시공 완료',
    desc: '선택된 공장이 시공을 진행하고, 소핏이 납기·품질을 끝까지 관리합니다.',
  },
]

const PAIN_POINTS = [
  {
    before: '공장 연락처 수소문하느라 며칠 소요',
    after: '소핏이 검증된 공장을 즉시 연결',
  },
  {
    before: '공장마다 별도 연락 → 견적 비교 불가',
    after: '한 번에 여러 공장 견적 수령·비교',
  },
  {
    before: '발주 후 진행 상황을 전혀 알 수 없음',
    after: '단계별 진행 상황 실시간 확인',
  },
  {
    before: '품질 불량·납기 지연 대응 방법 없음',
    after: '소핏이 공장과 중간에서 직접 조율',
  },
]

const FACTORY_BENEFITS = [
  { icon: '📦', title: '안정적인 발주', desc: '소핏이 검증한 고객 발주를 꾸준히 연결합니다.' },
  { icon: '🆓', title: '무료 입점', desc: '별도 수수료 없이 포트폴리오를 등록하고 노출됩니다.' },
  { icon: '🤝', title: '전담 매니저', desc: '소핏 담당자가 발주부터 납품까지 함께 합니다.' },
]

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
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gray-950 px-4 py-24 text-white sm:py-36">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.15),_transparent_60%)]" />
          <div className="relative mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-indigo-400">
              쇼파·빌트인 발주 매칭 플랫폼
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              쇼파·빌트인,
              <br />
              이제 소핏에 맡기세요
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-300">
              전국 검증 공장과 직접 연결됩니다.
              <br />
              발주부터 시공 완료까지 소핏이 함께 관리합니다.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/customer/request"
                className="rounded-full bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition-colors hover:bg-indigo-500"
              >
                무료 견적 요청하기
              </Link>
              <Link
                href="/portfolios"
                className="rounded-full border border-white/20 px-8 py-3.5 text-base font-semibold text-white/80 transition-colors hover:border-white/50 hover:text-white"
              >
                공장 포트폴리오 보기
              </Link>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              회원가입 없이 둘러보고, 요청 시에만 로그인하세요
            </p>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="bg-white px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-600">
                이용 방법
              </p>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                4단계로 끝나는 발주 프로세스
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <div
                  key={step.number}
                  className="rounded-2xl border border-gray-100 bg-gray-50 p-6"
                >
                  <span className="text-3xl font-black text-indigo-100">{step.number}</span>
                  <h3 className="mt-3 text-lg font-bold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Portfolio preview ── */}
        <section className="bg-gray-50 px-4 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-600">
                  파트너 공장
                </p>
                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  검증된 공장의 작업 사례
                </h2>
              </div>
              <Link
                href="/portfolios"
                className="shrink-0 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
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
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-gray-900">
                        {p.factories?.company_name ?? '공장'}
                      </p>
                      {p.factories?.location && (
                        <p className="mt-0.5 text-sm text-gray-400">{p.factories.location}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
                  >
                    <div className="flex aspect-[4/3] items-center justify-center bg-gray-100">
                      <p className="text-sm text-gray-400">포트폴리오 준비 중</p>
                    </div>
                    <div className="p-4">
                      <div className="h-4 w-24 rounded bg-gray-200" />
                      <div className="mt-1.5 h-3 w-16 rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Why SOFIT ── */}
        <section className="bg-white px-4 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-indigo-600">
                왜 소핏인가요
              </p>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                발주 담당자의 고민을 해결합니다
              </h2>
            </div>

            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100">
              {PAIN_POINTS.map((item, i) => (
                <div key={i} className="grid sm:grid-cols-2">
                  <div className="flex items-start gap-3 bg-red-50/50 px-6 py-5">
                    <span className="mt-0.5 shrink-0 text-red-400">✕</span>
                    <p className="text-sm text-gray-600">{item.before}</p>
                  </div>
                  <div className="flex items-start gap-3 px-6 py-5">
                    <span className="mt-0.5 shrink-0 text-indigo-500">✓</span>
                    <p className="text-sm font-medium text-gray-900">{item.after}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-indigo-600 px-4 py-20 text-white">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">지금 바로 견적을 요청하세요</h2>
            <p className="mt-4 text-indigo-200">
              쇼파 교체부터 빌트인 가구 제작까지 — 소핏이 적합한 공장을 찾아드립니다.
              <br />
              무료이며, 부담 없이 요청하실 수 있습니다.
            </p>
            <Link
              href="/customer/request"
              className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-base font-semibold text-indigo-700 shadow transition-colors hover:bg-indigo-50"
            >
              무료 견적 요청하기
            </Link>
          </div>
        </section>

        {/* ── Factory CTA ── */}
        <section className="bg-gray-900 px-4 py-20 text-white">
          <div className="mx-auto max-w-5xl">
            <div className="mb-12 text-center">
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-400">
                공장 파트너
              </p>
              <h2 className="text-3xl font-bold sm:text-4xl">소핏 파트너 공장으로 합류하세요</h2>
              <p className="mt-4 text-gray-400">
                안정적인 발주, 무료 입점, 소핏 전담 매니저와 함께 성장하세요.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {FACTORY_BENEFITS.map((b) => (
                <div key={b.title} className="rounded-2xl bg-gray-800 p-6">
                  <div className="mb-3 text-3xl">{b.icon}</div>
                  <h3 className="mb-1 font-bold text-white">{b.title}</h3>
                  <p className="text-sm text-gray-400">{b.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/login"
                className="inline-block rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10"
              >
                공장으로 가입하기
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-gray-100 bg-white px-4 py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-gray-400 sm:flex-row">
            <p className="font-bold text-gray-900">소핏 (SOFIT)</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-gray-600">
                이용약관
              </Link>
              <Link href="/privacy" className="hover:text-gray-600">
                개인정보처리방침
              </Link>
            </div>
            <p>© 2026 소핏. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </>
  )
}
