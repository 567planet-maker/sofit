import SidebarLayout from '@/components/common/SidebarLayout'
import { FACTORY_MANAGE_NAV } from '../manageNav'

export default function FactoryManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarLayout title="공장 관리" items={FACTORY_MANAGE_NAV}>
      {children}
    </SidebarLayout>
  )
}
