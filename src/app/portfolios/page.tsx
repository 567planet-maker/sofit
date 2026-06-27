import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import type { FactoryPortfolioWithFactory, PortfolioCategory } from '@/types'

export const metadata: Metadata = {
  title: '포트폴리오',
  description: '소핏 파트너 공장의 쇼파·빌트인 작업 사례를 확인하세요.',
}

const CATEGORY_LABELS: Record<PortfolioCategory | 'all', string> = {
  all: '전체',
  sofa: '쇼파',
  builtin: '빌트인',
  other: '기타',
}

async function getPortfolios(
  category?: string,
): Promise<FactoryPortfolioWithFactory[]> {
  const supabase = await createClient()
  let query = supabase
    .from('factory_portfolios')
    .select('*, factories(id, company_name, location)')
    .order('created_at', { ascending: false })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data } = await query
  return (data as FactoryPortfolioWithFactory[]) ?? []
}

export default async function PortfoliosPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const currentCategory = category ?? 'all'
  const portfolios = await getPortfolios(currentCategory === 'all' ? undefined : currentCategory)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-canvas px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight text-ink">업체찾기</h1>
            <p className="mt-1 text-ink-muted">파트너 공장의 실제 작업 사례입니다.</p>
          </div>

          {/* Category filter */}
          <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(CATEGORY_LABELS) as (PortfolioCategory | 'all')[]).map((cat) => (
              <Link
                key={cat}
                href={`/portfolios?category=${cat}`}
                className={`shrink-0 rounded-pill px-4 py-2 text-sm font-medium transition-colors ${
                  currentCategory === cat
                    ? 'bg-brand text-white'
                    : 'bg-surface text-ink-muted ring-1 ring-border hover:bg-surface-muted'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </Link>
            ))}
          </div>

          {portfolios.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-card border border-dashed border-border-strong bg-surface/50 text-center">
              <p className="font-medium text-ink-muted">등록된 포트폴리오가 없습니다.</p>
              <p className="mt-1 text-sm text-ink-subtle">파트너 공장 입점 후 작업 사례가 공개됩니다.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {portfolios.map((p) => (
                <Link
                  key={p.id}
                  href={`/portfolios/${p.id}`}
                  className="group overflow-hidden rounded-card border border-border bg-surface shadow-card transition-shadow hover:shadow-card-hover"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-surface-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image_url}
                      alt={p.description ?? '포트폴리오'}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-ink">
                          {p.factories?.company_name ?? '공장'}
                        </p>
                        {p.factories?.location && (
                          <p className="mt-0.5 text-sm text-ink-subtle">{p.factories.location}</p>
                        )}
                      </div>
                      {p.category && (
                        <span className="shrink-0 rounded-pill bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand">
                          {CATEGORY_LABELS[p.category]}
                        </span>
                      )}
                    </div>
                    {p.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{p.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
