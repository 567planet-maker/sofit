import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function FactoryChatListPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: factory } = await supabase
    .from('factories')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!factory) notFound()

  // confirmed 매칭에 연결된 customer_factory 채팅방
  const { data: matches } = await supabase
    .from('matches')
    .select('id')
    .eq('factory_id', factory.id)
    .eq('status', 'confirmed')

  const matchIds = matches?.map((m) => m.id) ?? []

  if (matchIds.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-gray-500">아직 채팅방이 없습니다.</p>
        <p className="mt-1 text-sm text-gray-400">매칭을 수락하면 고객과의 채팅방이 열립니다.</p>
      </div>
    )
  }

  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select('id, type, request_id, match_id, created_at, quote_requests(id, site_name, company_name)')
    .in('match_id', matchIds)
    .eq('type', 'customer_factory')
    .order('created_at', { ascending: false })

  if (!rooms || rooms.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-gray-500">아직 채팅방이 없습니다.</p>
        <p className="mt-1 text-sm text-gray-400">
          관리자가 채팅방을 개설하면 여기에 표시됩니다.
        </p>
      </div>
    )
  }

  const roomIds = rooms.map((r) => r.id)
  const { data: allMessages } = await supabase
    .from('chat_messages')
    .select('id, room_id, content, file_name, created_at, sender_id, read_at')
    .in('room_id', roomIds)
    .order('created_at', { ascending: false })

  type MsgRow = NonNullable<typeof allMessages>[number]
  const lastMsgByRoom: Record<string, MsgRow> = {}
  const unreadByRoom: Record<string, number> = {}

  for (const msg of allMessages ?? []) {
    if (!lastMsgByRoom[msg.room_id]) lastMsgByRoom[msg.room_id] = msg
    if (msg.sender_id !== user.id && !msg.read_at) {
      unreadByRoom[msg.room_id] = (unreadByRoom[msg.room_id] ?? 0) + 1
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">채팅</h1>
      <div className="space-y-2">
        {rooms.map((room) => {
          const req = (room as any).quote_requests
          const lastMsg = lastMsgByRoom[room.id]
          const unread = unreadByRoom[room.id] ?? 0

          return (
            <Link
              key={room.id}
              href={`/factory/chat/${room.id}`}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                <span className="text-sm font-bold text-green-700">고</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-gray-900">고객 직접 채팅</p>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {req?.site_name ?? ''}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-gray-500">
                  {lastMsg
                    ? lastMsg.content ?? `📎 ${lastMsg.file_name ?? '첨부파일'}`
                    : '대화를 시작하세요'}
                </p>
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1">
                {lastMsg && (
                  <span className="text-xs text-gray-400">{formatTime(lastMsg.created_at)}</span>
                )}
                {unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[11px] font-bold text-white">
                    {unread}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
