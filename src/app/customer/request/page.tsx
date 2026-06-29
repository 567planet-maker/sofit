import { redirect } from 'next/navigation'

// 기존 쇼파 전용 견적 폼은 다분야 폼(/customer/request/new)으로 대체됨.
// 구 URL·북마크 호환을 위해 리다이렉트만 유지한다.
// (구 폼 코드 QuoteRequestForm.tsx / 레거시 submitQuoteRequest는 Phase 6에서 정리)
export default function LegacyQuoteRequestRedirect() {
  redirect('/customer/request/new')
}
