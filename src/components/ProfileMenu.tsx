'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import { signOut } from '@/app/actions/auth'

/**
 * 헤더 프로필 메뉴 — 프로필 사진(아바타)을 누르면 "마이페이지 · 로그아웃" 드롭다운이 열린다.
 * 바깥 클릭 / Esc 로 닫힘. 로그아웃은 서버 액션(signOut)으로 세션 무효화 후 /login 이동.
 */
export default function ProfileMenu({
  name,
  avatarUrl,
  mypageHref,
}: {
  name: string | null
  avatarUrl: string | null
  mypageHref: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="프로필 메뉴"
        className="flex items-center gap-2 rounded-pill py-0.5 pl-0.5 pr-1 transition-colors hover:bg-surface-muted"
      >
        <Avatar src={avatarUrl} name={name} size="sm" />
        <span className="hidden max-w-[8rem] truncate text-sm font-medium text-ink sm:inline">
          {name ?? '사용자'}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-40 overflow-hidden rounded-control border border-border bg-surface py-1 shadow-pop"
        >
          <Link
            href={mypageHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
          >
            마이페이지
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
