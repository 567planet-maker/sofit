import { type NotificationType } from '@/types'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  body?: string
  link?: string
}

// 서버 전용 (service_role 필요)
export async function createNotification(
  supabase: ReturnType<typeof import('./supabase/server').createClient> extends Promise<infer T> ? T : never,
  params: CreateNotificationParams
) {
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body ?? null,
    link: params.link ?? null,
  })

  if (error) throw new Error(`알림 생성 실패: ${error.message}`)
}
