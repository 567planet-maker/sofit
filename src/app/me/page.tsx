'use client'

import { useState } from 'react'
import { signOut, deleteAccount } from '@/app/actions/auth'

export default function MePage() {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('계정을 삭제하면 모든 데이터가 사라집니다. 정말 삭제할까요?')) return
    setDeleting(true)
    await deleteAccount()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-3">
        <h1 className="mb-6 text-center text-xl font-bold text-gray-900">계정 관리</h1>

        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            로그아웃
          </button>
        </form>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full rounded-xl bg-red-500 py-3 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-40"
        >
          {deleting ? '삭제 중...' : '계정 삭제'}
        </button>

        <p className="text-center text-xs text-gray-400">
          계정 삭제 시 모든 데이터가 영구 삭제됩니다
        </p>
      </div>
    </div>
  )
}
