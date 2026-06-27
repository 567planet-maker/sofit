import { createClient } from '@/lib/supabase/server'

export type CurrentProfile = {
  id: string
  name: string | null
  email: string | null
  avatarUrl: string | null
  role: string | null
}

/** 로그인 사용자의 표시용 프로필 (이름·아바타·역할). 미로그인 시 null */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // select('*') — avatar_url 컬럼(migration 009) 미적용 환경에서도 깨지지 않도록
  const { data } = await supabase.from('users').select('*').eq('id', user.id).single()

  return {
    id: user.id,
    name: (data?.name as string | null) ?? null,
    email: (data?.email as string | null) ?? user.email ?? null,
    avatarUrl: (data?.avatar_url as string | null) ?? null,
    role: (data?.role as string | null) ?? null,
  }
}
