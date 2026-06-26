import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatSendForm from './ChatSendForm'

const ROLE_LABEL: Record<string, string> = {
  admin: '소핏 담당자',
  customer: '고객',
  factory: '공장',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminChatRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>
}) {
  const { roomId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // 채팅방 정보
  const { data: room } = await supabase
    .from('chat_rooms')
    .select('id, type, quote_requests(id, site_name, company_name)')
    .eq('id', roomId)
    .single()
  if (!room) notFound()

  // 메시지 목록 (발신자 정보 포함)
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, content, file_url, file_name, created_at, sender_id, users(name, role)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  const req = (room as any).quote_requests
  const isReadOnly = room.type === 'customer_factory'

  return (
    <div className="flex h-screen flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-4 border-b border-border bg-white px-6 py-4">
        <Link href="/admin/chats" className="text-sm text-brand hover:underline">
          ← 채팅 목록
        </Link>
        <div className="flex-1">
          <p className="font-medium text-ink">{req?.site_name ?? '(현장 정보 없음)'}</p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">{req?.company_name}</span>
            {isReadOnly && (
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-ink-muted">
                읽기 전용 (고객↔공장 직접 채팅)
              </span>
            )}
          </div>
        </div>
        {req?.id && (
          <Link
            href={`/admin/requests/${req.id}`}
            className="text-sm text-brand hover:underline"
          >
            견적 상세 →
          </Link>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto bg-surface-muted px-6 py-4 space-y-4">
        {!messages || messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-subtle">메시지가 없습니다.</p>
        ) : (
          (messages as any[]).map((msg) => {
            const isAdmin = msg.users?.role === 'admin'
            const isMine = msg.sender_id === user.id
            const senderLabel = msg.users?.name
              ? `${msg.users.name} (${ROLE_LABEL[msg.users.role] ?? msg.users.role})`
              : ROLE_LABEL[msg.users?.role] ?? '알 수 없음'

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <span className="mb-1 text-xs text-ink-subtle">{senderLabel}</span>
                <div
                  className={`max-w-xs rounded-card px-4 py-2.5 text-sm lg:max-w-md ${
                    isMine
                      ? 'bg-brand text-white'
                      : isAdmin
                        ? 'bg-brand-tint text-brand'
                        : 'bg-white text-ink shadow-card'
                  }`}
                >
                  {msg.content && <p>{msg.content}</p>}
                  {msg.file_url && (
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {msg.file_name ?? '첨부파일'}
                    </a>
                  )}
                </div>
                <span className="mt-1 text-xs text-ink-subtle">{formatTime(msg.created_at)}</span>
              </div>
            )
          })
        )}
      </div>

      {/* 메시지 입력 */}
      {isReadOnly ? (
        <div className="border-t border-border bg-surface-muted px-6 py-4 text-center text-sm text-ink-muted">
          고객과 공장이 직접 소통하는 채팅방입니다. 관리자는 읽기 전용으로 모니터링합니다.
        </div>
      ) : (
        <ChatSendForm roomId={roomId} />
      )}
    </div>
  )
}
