import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PortfolioManager from './PortfolioManager'

export default async function FactoryPortfoliosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: factory } = await supabase
    .from('factories')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!factory) notFound()

  const { data: portfolios = [] } = await supabase
    .from('factory_portfolios')
    .select('id, image_url, description, category, completed_at')
    .eq('factory_id', factory.id)
    .order('created_at', { ascending: false })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">포트폴리오 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          작업 사례를 등록하면 고객에게 공개됩니다.
        </p>
      </div>
      <PortfolioManager
        portfolios={portfolios ?? []}
        supabaseUrl={supabaseUrl}
      />
    </div>
  )
}
