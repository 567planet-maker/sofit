import type { QuoteRequestStatus } from '@/types'

export const QUOTE_REQUEST_STATUS_LABELS: Record<QuoteRequestStatus, string> = {
  submitted: '접수됨',
  reviewing: '검토중',
  matching: '매칭중',
  quote_arrived: '견적서 도착',
  negotiating: '소통중',
  contracted: '계약완료',
  in_progress: '시공중',
  completed: '완료',
}
