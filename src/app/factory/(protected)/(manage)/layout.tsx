import SidebarLayout from '@/components/common/SidebarLayout'
import { FACTORY_MANAGE_NAV } from '../manageNav'

export default function FactoryManageLayout({ children }: { children: React.ReactNode }) {
  return <SidebarLayout items={FACTORY_MANAGE_NAV}>{children}</SidebarLayout>
}
