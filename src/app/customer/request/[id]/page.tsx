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
  const initialItemIds: Record<string, string> = {}
  for (const item of loaded.items) {
    initialItems[item.category] = item.details ?? {}
    initialItemIds[item.category] = item.id
  }

  // 전체(item_id NULL) + 분야별(item_id) 첨부를 모두 전달 — 스튜디오가 분배.
  // 이미지 썸네일은 서버에서 signed URL을 미리 발급(앱 공통 패턴, 브라우저 발급보다 안정적).
  const isImageKind = (kind: string) => kind !== 'drawing' && kind !== 'prev_quote'
  const initialAttachments = await Promise.all(
    loaded.attachments.map(async (a) => {
      const kind = a.kind as string
      const storagePath = a.storage_path as string
      let url: string | undefined
      if (isImageKind(kind)) {
        const { data } = await supabase.storage
          .from('request-images')
          .createSignedUrl(storagePath, 3600)
        url = data?.signedUrl
      }
      return {
        id: a.id as string,
        item_id: (a.item_id as string | null) ?? null,
        kind,
        storage_path: storagePath,
        file_name: (a.file_name as string | null) ?? null,
        mime_type: (a.mime_type as string | null) ?? null,
        size_bytes: (a.size_bytes as number | null) ?? null,
        note: (a.note as string | null) ?? null,
        url,
      }
    }),
  )

  return (
    // 전역 앱 헤더(sticky, 56px) 아래에서 남은 뷰포트를 채운다.
    // 데스크톱: 사이드 패널 독립 스크롤 / 모바일(<lg): 자연 스크롤로 스택.
    <div className="flex flex-col bg-canvas lg:h-[calc(100vh-56px)] max-lg:min-h-[calc(100vh-56px)]">
      <QuoteRequestStudio
        requestId={id}
        initialCommon={initialCommon}
        initialItems={initialItems}
        initialItemIds={initialItemIds}
        initialAttachments={initialAttachments}
      />
    </div>
  )
}
