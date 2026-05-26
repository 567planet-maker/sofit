'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface FactoryProfileInput {
  company_name: string
  location?: string
  description?: string
}

export async function createFactoryProfile(input: FactoryProfileInput) {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) redirect('/login')

  const { error } = await supabase.from('factories').insert({
    user_id: user!.id,
    company_name: input.company_name,
    location: input.location ?? null,
    description: input.description ?? null,
    status: 'pending',
  })

  if (error) throw new Error(`공장 프로필 생성 실패: ${error.message}`)

  redirect('/factory/pending')
}
