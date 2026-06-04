'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, markRoomRead } from '@/app/actions/chat'
import type { ChatMessageWithSender } from '@/types'

interface Props {
  roomId: string
  currentUserId: string
  currentUserRole: string
  initialMessages: ChatMessageWithSender[]
  isReadOnly?: boolean
}

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

export default function ChatRoom({
  roomId,
  currentUserId,
  currentUserRole,
  initialMessages,
  isReadOnly = false,
}: Props) {
  const [messages, setMessages] = useState<ChatMessageWithSender[]>(initialMessages)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    markRoomRead(roomId)
  }, [roomId])

  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any
          // 중복 방지
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev
            return prev
          })

          const { data: senderData } = await supabase
            .from('users')
            .select('id, name, role')
            .eq('id', newMsg.sender_id)
            .single()

          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev
            return [
              ...prev,
              {
                ...newMsg,
                users: senderData ?? { id: newMsg.sender_id, name: null, role: 'customer' },
              },
            ]
          })

          if (newMsg.sender_id !== currentUserId) {
            markRoomRead(roomId)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSend() {
    if ((!input.trim() && !isUploading) || isPending) return
    setError(null)
    const content = input
    setInput('')
    startTransition(async () => {
      const res = await sendMessage(roomId, content)
      if (res?.error) {
        setError(res.error)
        setInput(content)
      }
    })
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      setError('jpg, png, webp, pdf 파일만 업로드 가능합니다.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('파일 크기는 20MB 이하여야 합니다.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploading(true)
    setError(null)
    const ext = file.name.split('.').pop()
    const path = `${roomId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(path, file)

    if (uploadError) {
      setError(`업로드 실패: ${uploadError.message}`)
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('chat-attachments').getPublicUrl(path)

    startTransition(async () => {
      const res = await sendMessage(roomId, '', publicUrl, file.name)
      if (res?.error) setError(res.error)
      setIsUploading(false)
    })

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            {isReadOnly ? '메시지가 없습니다.' : '대화를 시작하세요.'}
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId
            const senderRole = (msg.users as any)?.role ?? ''
            const senderName = (msg.users as any)?.name
            const isAdmin = senderRole === 'admin'
            const label = senderName
              ? `${senderName} (${ROLE_LABEL[senderRole] ?? senderRole})`
              : ROLE_LABEL[senderRole] ?? '알 수 없음'

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                {!isMine && <span className="mb-1 text-xs text-gray-400">{label}</span>}
                <div
                  className={`max-w-xs rounded-2xl px-4 py-2.5 text-sm lg:max-w-md ${
                    isMine
                      ? 'bg-indigo-600 text-white'
                      : isAdmin
                        ? 'bg-indigo-100 text-indigo-900'
                        : 'bg-white text-gray-800 shadow-sm'
                  }`}
                >
                  {msg.content && (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  )}
                  {msg.file_url && (
                    <a
                      href={msg.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm underline ${isMine ? 'text-indigo-200' : 'text-indigo-600'}`}
                    >
                      📎 {msg.file_name ?? '첨부파일'}
                    </a>
                  )}
                </div>
                <span className="mt-1 text-xs text-gray-400">{formatTime(msg.created_at)}</span>
              </div>
            )
          })
        )}
      </div>

      {isReadOnly ? (
        <div className="border-t border-gray-200 bg-gray-100 px-4 py-3 text-center text-sm text-gray-500">
          읽기 전용 채팅방입니다.
        </div>
      ) : (
        <div className="border-t border-gray-200 bg-white px-4 py-3">
          {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isPending}
              className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
              title="파일 첨부"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a1.5 1.5 0 002.122 2.121l7.131-7.13a.75.75 0 011.06 1.061l-7.13 7.13a3 3 0 01-4.243-4.244l7-7a4.5 4.5 0 016.364 6.364l-7 7a6 6 0 01-8.485-8.485l7.007-7a.75.75 0 011.06 1.06l-7.007 7a4.5 4.5 0 006.364 6.364l7-7a3 3 0 000-4.243z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={isUploading ? '업로드 중...' : '메시지 입력 (Ctrl+Enter 전송)'}
              disabled={isPending || isUploading}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isPending || isUploading}
              className="flex-shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
            >
              전송
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
