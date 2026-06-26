'use client'

import { useState } from 'react'
import { signOut, deleteAccount } from '@/app/actions/auth'

export default function AccountActions() {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('계정을 삭제하면 모든 데이터가 사라집니다. 정말 삭제할까요?')) return
    setDeleting(true)
    await deleteAccount()
  }

  return (
    <div className="space-y-3">
      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-control border border-border bg-surface py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
        >
          로그아웃
        </button>
      </form>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="w-full rounded-control border border-danger/30 bg-danger-tint py-2.5 text-sm font-medium text-danger transition-opacity hover:opacity-80 disabled:opacity-40"
      >
        {deleting ? '삭제 중...' : '계정 삭제'}
      </button>
      <p className="text-center text-xs text-ink-subtle">계정 삭제 시 모든 데이터가 영구 삭제됩니다.</p>
    </div>
  )
}
