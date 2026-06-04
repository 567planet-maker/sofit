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

const ROOM_TYPE_LABEL: Record<string, string> = {
  customer_sofit: '소핏 상담',
  customer_factory: '공장 직접 채팅',
}

export default async function CustomerChatListPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!customer) notFound()

  // 이 고객의 견적 요청 ID 목록
  const { data: requests } = await supabase
    .from('quote_requests')
    .select('id, site_name, company_name')
    .eq('customer_id', customer.id)

  const requestIds = requests?.map((r) => r.id) ?? []
  const requestMap = Object.fromEntries(
    (requests ?? []).map((r) => [r.id, { site_name: r.site_name, company_name: r.company_name }]),
  )

  if (requestIds.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-gray-500">아직 채팅방이 없습니다.</p>
        <Link
          href="/customer/request"
          className="mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          견적 요청하기
        </Link>
      </div>
    )
  }

  // 채팅방 목록 (customer_sofit + customer_factory)
  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select('id, type, request_id, created_at')
    .in('request_id', requestIds)
    .in('type', ['customer_sofit', 'customer_factory'])
    .order('created_at', { ascending: false })

  if (!rooms || rooms.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-gray-500">아직 채팅방이 없습니다.</p>
        <p className="mt-1 text-sm text-gray-400">견적 요청을 제출하면 상담 채팅방이 열립니다.</p>
      </div>
    )
  }

  // 각 채팅방의 마지막 메시지 및 미읽음 카운트
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
          const req = requestMap[room.request_id]
          const lastMsg = lastMsgByRoom[room.id]
          const unread = unreadByRoom[room.id] ?? 0

          return (
            <Link
              key={room.id}
              href={`/customer/chat/${room.id}`}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-indigo-200 hover:bg-indigo-50"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                <span className="text-sm font-bold text-indigo-700">
                  {room.type === 'customer_sofit' ? 'S' : '공'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {ROOM_TYPE_LABEL[room.type]}
                  </p>
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
