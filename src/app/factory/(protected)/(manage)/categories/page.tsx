import { getFactoryCategories } from '@/app/actions/factory'
import FactoryCategoryManager from './FactoryCategoryManager'

export default async function FactoryCategoriesPage() {
  const selected = await getFactoryCategories()
  return <FactoryCategoryManager initialSelected={selected} />
}
