import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getQuoteRequest } from '@/app/actions/quote-request'
import { COMMON_COLUMN_MAP } from '@/app/customer/request/schema/commonSchema'
import QuoteRequestStudio from '../_studio/QuoteRequestStudio'

export const metadata: Metadata = {
  title: '견적 요청 작성',
}

export default async function EditQuoteRequestPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/customer/request/${id}`)

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (userData?.role && userData.role !== 'customer') redirect(`/${userData.role}`)

  // 소유권은 RLS로 보장 (본인 요청이 아니면 error)
  const loaded = await getQuoteRequest(id)
  if ('error' in loaded) redirect('/customer/me/requests')

  // 이미 제출된 요청은 편집 불가 → 읽기 전용 상세로
  if (loaded.request.status !== 'draft') redirect(`/customer/requests/${id}`)

  // 공통 컬럼 → 스키마 키 역매핑
  const initialCommon: Record<string, unknown> = {}
  for (const [key, column] of Object.entries(COMMON_COLUMN_MAP)) {
    const v = loaded.request[column]
    if (v !== null && v !== undefined) initialCommon[key] = v
  }

  const initialItems: Record<string, Record<string, unknown>> = {}
  for (const item of loaded.items) {
    initialItems[item.category] = item.details ?? {}
  }

  const initialAttachments = loaded.attachments
    .filter((a) => a.item_id == null) // 요청 단위(공통) 첨부만
    .map((a) => ({
      id: a.id as string,
      kind: a.kind as string,
      storage_path: a.storage_path as string,
      file_name: (a.file_name as string | null) ?? null,
      mime_type: (a.mime_type as string | null) ?? null,
    }))

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="border-b border-border bg-white px-4 py-5">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-semibold text-ink">견적 요청</h1>
          <p className="mt-1 text-sm text-ink-muted">
            시공 분야를 선택하고 공통 정보와 분야별 내용을 작성하세요. 작성 중 내용은 임시저장됩니다.
          </p>
        </div>
      </div>
      <QuoteRequestStudio
        requestId={id}
        initialCommon={initialCommon}
        initialItems={initialItems}
        initialAttachments={initialAttachments}
      />
    </div>
  )
}
