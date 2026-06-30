import { createClient, createServiceClient } from '@/lib/supabase/server'

function bucketFor(kind: string) {
  return kind === 'drawing' || kind === 'prev_quote' ? 'request-documents' : 'request-images'
}

type Row = { id: string; kind: string; storage_path: string; file_name: string | null }

/**
 * 요청 단위(item_id NULL) 첨부 — 현장 사진·도면 갤러리.
 * 고객/공장/관리자 상세에서 공용. RLS로 권한 있는 사용자에게만 노출.
 * 첨부가 없으면 아무것도 렌더하지 않는다.
 */
export default async function AttachmentGallery({
  requestId,
  className = 'border-t border-border pt-4',
}: {
  requestId: string
  className?: string
}) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('quote_request_attachments')
    .select('id, kind, storage_path, file_name')
    .eq('request_id', requestId)
    .is('item_id', null)
    .order('created_at', { ascending: true })

  const rows = (data ?? []) as Row[]
  if (rows.length === 0) return null

  // 행 조회는 user 클라이언트(RLS)로 권한 확인 완료 → 서명 URL은 service 클라이언트로
  // 생성(공장이 고객 폴더 파일을 볼 수 있도록 스토리지 RLS 우회, 권한은 위에서 검증).
  const storage = createServiceClient()
  const withUrls = await Promise.all(
    rows.map(async (a) => {
      const { data: signed } = await storage.storage
        .from(bucketFor(a.kind))
        .createSignedUrl(a.storage_path, 3600)
      return { ...a, url: signed?.signedUrl ?? null }
    }),
  )
  const photos = withUrls.filter((a) => bucketFor(a.kind) === 'request-images')
  const docs = withUrls.filter((a) => bucketFor(a.kind) === 'request-documents')

  return (
    <div className={className}>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
        현장 사진·도면
      </h3>
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((a) =>
            a.url ? (
              <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.file_name ?? '사진'}
                  className="aspect-square w-full rounded-card object-cover hover:opacity-90"
                />
              </a>
            ) : null,
          )}
        </div>
      )}
      {docs.length > 0 && (
        <ul className="mt-3 space-y-2">
          {docs.map((a) =>
            a.url ? (
              <li key={a.id}>
                <a
                  href={a.url}
                  download={a.file_name ?? undefined}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface-muted p-3 hover:bg-surface-muted"
                >
                  <span className="text-xl">📄</span>
                  <p className="truncate text-sm font-medium text-ink">
                    {a.file_name ?? '첨부 파일'}
                  </p>
                </a>
              </li>
            ) : null,
          )}
        </ul>
      )}
    </div>
  )
}
