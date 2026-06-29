import Badge, { type BadgeTone } from '@/components/ui/Badge'
import type { QuoteRequestStatus } from '@/types'

const STATUS_MAP: Record<QuoteRequestStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: '임시저장', tone: 'neutral' },
  submitted: { label: '접수됨', tone: 'info' },
  reviewing: { label: '검토중', tone: 'warning' },
  matching: { label: '매칭중', tone: 'brand' },
  quote_arrived: { label: '견적 도착', tone: 'purple' },
  negotiating: { label: '소통중', tone: 'info' },
  contracted: { label: '계약완료', tone: 'success' },
  in_progress: { label: '시공중', tone: 'success' },
  completed: { label: '완료', tone: 'neutral' },
}

export default function StatusBadge({ status }: { status: QuoteRequestStatus }) {
  const { label, tone } = STATUS_MAP[status] ?? { label: status, tone: 'neutral' as BadgeTone }
  return <Badge tone={tone}>{label}</Badge>
}
