import { cn } from '@/lib/utils/cn'

/** 채팅 영역 상단 헤더 바 — 목록/대화방 공통 (높이·테두리 통일) */
export default function ChatHeaderBar({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex h-14 flex-shrink-0 items-center gap-4 border-b border-border bg-surface px-4',
        className,
      )}
    >
      {children}
    </div>
  )
}
