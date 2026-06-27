import { redirect } from 'next/navigation'

/** 고객 전용 대시보드는 없음 — 마이페이지로 이동 */
export default function CustomerIndexPage() {
  redirect('/customer/me')
}
