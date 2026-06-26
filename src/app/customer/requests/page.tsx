import { redirect } from 'next/navigation'

/** 견적 목록은 마이페이지로 통합 → /customer/me/requests 로 이동 */
export default async function CustomerRequestsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  redirect(`/customer/me/requests${status ? `?status=${status}` : ''}`)
}
