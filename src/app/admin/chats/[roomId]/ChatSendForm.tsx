'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sendAdminMessage } from '@/app/actions/admin'

export default function ChatSendForm({ roomId }: { roomId: string }) {
  const [content, setContent] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSend = () => {
    if (!content.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await sendAdminMessage(roomId, content)
      if (result.error) {
        setError(result.error)
      } else {
        setContent('')
        router.refresh()
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSend()
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지 입력 (Ctrl+Enter로 전송)"
          rows={2}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
        />
        <button
          onClick={handleSend}
          disabled={isPending || !content.trim()}
          className="flex-shrink-0 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
        >
          {isPending ? '전송 중...' : '전송'}
        </button>
      </div>
    </div>
  )
}
