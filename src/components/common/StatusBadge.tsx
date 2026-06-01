import type { QuoteRequestStatus } from '@/types'

const STATUS_MAP: Record<QuoteRequestStatus, { label: string; className: string }> = {
  submitted: { label: '접수됨', className: 'bg-blue-50 text-blue-700 ring-blue-600/20' },
  reviewing: { label: '검토중', className: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20' },
  matching: { label: '매칭중', className: 'bg-orange-50 text-orange-700 ring-orange-600/20' },
  quote_arrived: { label: '견적 도착', className: 'bg-purple-50 text-purple-700 ring-purple-600/20' },
  negotiating: { label: '소통중', className: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20' },
  contracted: { label: '계약완료', className: 'bg-green-50 text-green-700 ring-green-600/20' },
  in_progress: { label: '시공중', className: 'bg-teal-50 text-teal-700 ring-teal-600/20' },
  completed: { label: '완료', className: 'bg-gray-100 text-gray-600 ring-gray-500/20' },
}

export default function StatusBadge({ status }: { status: QuoteRequestStatus }) {
  const { label, className } = STATUS_MAP[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600 ring-gray-500/20',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {label}
    </span>
  )
}
