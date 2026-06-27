import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import { createClient } from '@/lib/supabase/server'
import type { PortfolioCategory } from '@/types'

const CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  sofa: '쇼파',
  builtin: '빌트인',
  other: '기타',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('factory_portfolios')
    .select('description, factories(company_name)')
    .eq('id', id)
    .single()

  const factory = (data?.factories as { company_name?: string } | null)?.company_name ?? '공장'
  return {
    title: `${factory} 포트폴리오`,
    description: data?.description ?? `${factory}의 작업 사례입니다.`,
  }
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: portfolio } = await supabase
    .from('factory_portfolios')
    .select('*, factories(id, company_name, location, description)')
    .eq('id', id)
    .single()

  if (!portfolio) notFound()

  const factory = portfolio.factories as {
    id: string
    company_name: string
    location: string | null
    description: string | null
  } | null

  return (
    <>
      <Header />
      <main className="min-h-screen bg-canvas px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/portfolios"
            className="mb-6 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
          >
            ← 업체찾기 목록
          </Link>

          <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
            <div className="aspect-[16/9] overflow-hidden bg-surface-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portfolio.image_url}
                alt={portfolio.description ?? '포트폴리오'}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-start gap-3">
                {portfolio.category && (
                  <span className="rounded-pill bg-brand-tint px-3 py-1 text-sm font-medium text-brand">
                    {CATEGORY_LABELS[portfolio.category as PortfolioCategory]}
                  </span>
                )}
                {portfolio.completed_at && (
                  <span className="rounded-pill bg-surface-muted px-3 py-1 text-sm text-ink-muted">
                    {new Date(portfolio.completed_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </span>
                )}
              </div>

              {portfolio.description && (
                <p className="mt-4 leading-relaxed text-ink-muted">{portfolio.description}</p>
              )}

              {factory && (
                <div className="mt-6 rounded-card bg-surface-muted p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-ink-subtle">
                    공장 정보
                  </p>
                  <p className="mt-1 font-medium text-ink">{factory.company_name}</p>
                  {factory.location && (
                    <p className="mt-0.5 text-sm text-ink-muted">{factory.location}</p>
                  )}
                  {factory.description && (
                    <p className="mt-2 text-sm text-ink-muted">{factory.description}</p>
                  )}
                </div>
              )}

              <div className="mt-6">
                <Link
                  href="/customer/request"
                  className="block rounded-control bg-brand py-3 text-center font-medium text-white transition-colors hover:bg-brand-hover"
                >
                  이 공장에 견적 요청하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
