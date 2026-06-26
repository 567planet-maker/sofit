import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { markAllNotificationsRead } from '@/app/actions/notifications'

const TYPE_ICON: Record<string, string> = {
  new_request: '📋',
  new_match: '🔗',
  quote_arrived: '💰',
  new_message: '💬',
  status_changed: '🔄',
  factory_approved: '✅',
  factory_rejected: '❌',
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const unreadCount = (notifications ?? []).filter((n) => !n.read_at).length

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">알림</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-ink-muted">읽지 않은 알림 {unreadCount}개</p>
          )}
        </div>
        {unreadCount > 0 && (
          <form
            action={async () => {
              'use server'
              await markAllNotificationsRead()
            }}
          >
            <button type="submit" className="text-sm text-brand hover:underline">
              모두 읽음 처리
            </button>
          </form>
        )}
      </div>

      {!notifications || notifications.length === 0 ? (
        <div className="rounded-card border border-border bg-white py-16 text-center">
          <p className="text-ink-subtle">알림이 없습니다.</p>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-card border border-border bg-white">
          {notifications.map((notif) => (
            <a
              key={notif.id}
              href={notif.link ?? '#'}
              className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-muted ${
                !notif.read_at ? 'bg-brand-tint' : ''
              }`}
            >
              <span className="mt-0.5 flex-shrink-0 text-lg">
                {TYPE_ICON[notif.type] ?? '🔔'}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-ink">{notif.title}</p>
                  {!notif.read_at && (
                    <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand" />
                  )}
                </div>
                {notif.body && (
                  <p className="mt-0.5 truncate text-sm text-ink-muted">{notif.body}</p>
                )}
                <p className="mt-1 text-xs text-ink-subtle">{formatTime(notif.created_at)}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
