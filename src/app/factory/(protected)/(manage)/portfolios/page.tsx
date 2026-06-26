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
    <div>
      <PortfolioManager
        portfolios={portfolios ?? []}
        supabaseUrl={supabaseUrl}
      />
    </div>
  )
}
