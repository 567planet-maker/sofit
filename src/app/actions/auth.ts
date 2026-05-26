'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

async function getOrigin() {
  const headersList = await headers()
  return headersList.get('origin') ?? ''
}

export async function signInWithKakao() {
  const supabase = await createClient()
  const origin = await getOrigin()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: { redirectTo: `${origin}/auth/callback` },
  })

  if (error || !data.url) redirect('/login?error=oauth')
  redirect(data.url)
}

export async function signInWithNaver() {
  const supabase = await createClient()
  const origin = await getOrigin()

  // Naver: Supabase Dashboard > Authentication > Providers > Add Custom OIDC
  // Provider Slug: "naver" 로 등록 후 동작
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'naver' as Parameters<typeof supabase.auth.signInWithOAuth>[0]['provider'],
    options: { redirectTo: `${origin}/auth/callback` },
  })

  if (error || !data.url) redirect('/login?error=oauth')
  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function updateUserRole(role: UserRole) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  await supabase.auth.updateUser({ data: { role } })
  await supabase.from('users').update({ role }).eq('id', user!.id)

  if (role === 'factory') redirect('/factory/onboarding')
  redirect('/customer')
}
