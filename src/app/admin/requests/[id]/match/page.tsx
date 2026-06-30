import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StatusBadge from '@/components/common/StatusBadge'
import type { QuoteRequestStatus } from '@/types'
import { ALL_CATEGORIES } from '@/app/customer/request/schema/categories'
import MatchClient from './MatchClient'

export default async function AdminMatchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: requestId } = await params
  const supabase = await createClient()

  // 요청 기본 정보
  const { data: req } = await supabase
    .from('quote_requests')
    .select('id, site_name, status')
    .eq('id', requestId)
    .single()
  if (!req) notFound()

  // 기존 매칭 목록 (공장 정보 + 견적서 + 채팅방)
  const { data: rawMatches } = await supabase
    .from('matches')
    .select(
      `
      id, status, note, created_at,
      factories(id, company_name, location),
      factory_quotes(total_cost, delivery_days, status)
    `,
    )
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })

  // 채팅방 조회 (customer_factory 타입)
  const { data: chatRooms } = await supabase
    .from('chat_rooms')
    .select('id, match_id')
    .eq('request_id', requestId)
    .eq('type', 'customer_factory')

  const chatRoomMap: Record<string, string> = {}
  for (const room of chatRooms ?? []) {
    if (room.match_id) chatRoomMap[room.match_id] = room.id
  }

  type RawMatch = {
    id: string
    status: string
    note: string | null
    created_at: string
    factories: { id: string; company_name: string; location: string | null } | null
    factory_quotes: { total_cost: number; delivery_days: number | null; status: string }[]
  }
  const existingMatches = ((rawMatches ?? []) as unknown as RawMatch[]).map((m) => ({
    ...m,
    chatRoomId: chatRoomMap[m.id] ?? null,
  }))

  // 요청에 포함된 분야(item) → 정렬·라벨 (배정을 분야별로 묶기 위함)
  const { data: itemRows } = await supabase
    .from('quote_request_items')
    .select('category')
    .eq('request_id', requestId)
  const reqCatKeys = new Set((itemRows ?? []).map((r) => r.category as string))
  const requestCategories = ALL_CATEGORIES.filter((c) => reqCatKeys.has(c.key)).map((c) => ({
    key: c.key as string,
    label: c.label,
  }))

  // 활성 공장 전체 + 각 공장의 전문 분야 + 현재 매칭 상태
  const { data: allActiveFactories } = await supabase
    .from('factories')
    .select('id, company_name, location, description, rating_avg')
    .eq('status', 'active')
    .order('company_name')

  const activeIds = (allActiveFactories ?? []).map((f) => f.id)
  const { data: fcRows } =
    activeIds.length > 0
      ? await supabase
          .from('factory_categories')
          .select('factory_id, category')
          .in('factory_id', activeIds)
      : { data: [] as { factory_id: string; category: string }[] }

  const factoryCatMap = new Map<string, string[]>()
  for (const r of fcRows ?? []) {
    const list = factoryCatMap.get(r.factory_id) ?? []
    list.push(r.category)
    factoryCatMap.set(r.factory_id, list)
  }

  const matchStatusByFactory = new Map<string, string>()
  for (const m of existingMatches) {
    if (m.status !== 'cancelled' && m.factories?.id) {
      matchStatusByFactory.set(m.factories.id, m.status)
    }
  }

  const factories = (allActiveFactories ?? []).map((f) => ({
    ...f,
    categories: factoryCatMap.get(f.id) ?? [],
    matchStatus: matchStatusByFactory.get(f.id) ?? null,
  }))

  return (
    <div className="mx-auto max-w-3xl p-8">
      {/* 헤더 */}
      <div className="mb-6">
        <Link
          href={`/admin/requests/${requestId}`}
          className="mb-2 block text-sm text-brand hover:underline"
        >
          ← {req.site_name}
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-ink">공장 매칭 관리</h1>
          <StatusBadge status={req.status as QuoteRequestStatus} />
        </div>
      </div>

      <MatchClient
        requestId={requestId}
        requestCategories={requestCategories}
        factories={factories}
        existingMatches={existingMatches}
      />
    </div>
  )
}
