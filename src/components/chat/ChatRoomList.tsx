'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'

export type ChatRoomListItem = {
  id: string
  href: string
  name: string
  subtitle?: string
  preview: string
  time?: string
  unread?: number
  /** fallback 이니셜 (사진 없을 때) */
  avatar?: string
  /** 상대방 프로필 사진 URL */
  avatarUrl?: string | null
}

/** 채팅 좌측 방 목록 — 상대 이름 + 마지막 메시지 미리보기, 현재 방 하이라이트 */
export default function ChatRoomList({ rooms }: { rooms: ChatRoomListItem[] }) {
  const pathname = usePathname()

  if (rooms.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-ink-subtle">
        아직 채팅방이 없습니다.
      </p>
    )
  }

  return (
    <div>
      {rooms.map((room) => {
        const active = pathname === room.href
        return (
          <Link
            key={room.id}
            href={room.href}
            className={`flex gap-3 border-b border-border px-4 py-3 transition-colors ${
              active ? 'bg-brand-tint' : 'hover:bg-surface-muted'
            }`}
          >
            <Avatar src={room.avatarUrl} name={room.avatar ?? room.name} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium text-ink">{room.name}</p>
                {room.time && (
                  <span className="flex-shrink-0 text-[11px] text-ink-subtle">{room.time}</span>
                )}
              </div>
              {room.subtitle && (
                <p className="truncate text-xs text-ink-subtle">{room.subtitle}</p>
              )}
              <div className="mt-0.5 flex items-center justify-between gap-2">
                <p className="truncate text-sm text-ink-muted">{room.preview}</p>
                {room.unread ? (
                  <span className="flex h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-semibold text-white">
                    {room.unread}
                  </span>
                ) : null}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
