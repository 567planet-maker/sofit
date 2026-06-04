'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveQuoteDraft, submitFactoryQuote, type QuoteInput } from '@/app/actions/factory'

type ExistingQuote = {
  material_cost: number
  labor_cost: number
  delivery_cost: number
  install_cost: number
  demolition_cost: number
  extra_cost: number
  margin: number
  delivery_days: number | null
  note: string | null
  status: string
  version: number
}

type Props = {
  matchId: string
  existing?: ExistingQuote | null
}

type CostKey =
  | 'material_cost'
  | 'labor_cost'
  | 'delivery_cost'
  | 'install_cost'
  | 'demolition_cost'
  | 'extra_cost'
  | 'margin'

type CostState = Record<CostKey, number>

const COST_FIELDS: { key: CostKey; label: string }[] = [
  { key: 'material_cost', label: '재료비' },
  { key: 'labor_cost', label: '인건비' },
  { key: 'delivery_cost', label: '배송비' },
  { key: 'install_cost', label: '설치비' },
  { key: 'demolition_cost', label: '철거비' },
  { key: 'extra_cost', label: '기타' },
  { key: 'margin', label: '마진' },
]

function formatKrw(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n)
}

export default function QuoteForm({ matchId, existing }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const isSubmitted = existing?.status === 'submitted'
  const isDraft = existing?.status === 'draft'

  // submitted 상태에서 수정 버튼을 누르면 편집 모드 진입
  const [isEditing, setIsEditing] = useState(isDraft)

  const [costs, setCosts] = useState<CostState>({
    material_cost: existing?.material_cost ?? 0,
    labor_cost: existing?.labor_cost ?? 0,
    delivery_cost: existing?.delivery_cost ?? 0,
    install_cost: existing?.install_cost ?? 0,
    demolition_cost: existing?.demolition_cost ?? 0,
    extra_cost: existing?.extra_cost ?? 0,
    margin: existing?.margin ?? 0,
  })
  const [deliveryDays, setDeliveryDays] = useState<string>(
    existing?.delivery_days != null ? String(existing.delivery_days) : '',
  )
  const [note, setNote] = useState(existing?.note ?? '')

  const total = Object.values(costs).reduce((sum, v) => sum + (v || 0), 0)

  const buildInput = (): QuoteInput => ({
    ...costs,
    delivery_days: deliveryDays ? Number(deliveryDays) : null,
    note: note || null,
  })

  const handleSaveDraft = () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    startTransition(async () => {
      const result = await saveQuoteDraft(matchId, buildInput())
      if (result.error) {
        setErrorMsg(result.error)
      } else {
        setSuccessMsg('임시저장 완료')
        router.refresh()
      }
    })
  }

  const handleSubmit = () => {
    if (total === 0) {
      setErrorMsg('금액을 입력해주세요.')
      return
    }
    setErrorMsg(null)
    setSuccessMsg(null)
    startTransition(async () => {
      const result = await submitFactoryQuote(matchId, buildInput())
      if (result.error) {
        setErrorMsg(result.error)
      } else {
        router.refresh()
      }
    })
  }

  // ── 제출 완료 상태 (수정 모드가 아닐 때) ──────────────────────
  if (isSubmitted && !isEditing) {
    const submittedTotal =
      existing!.material_cost +
      existing!.labor_cost +
      existing!.delivery_cost +
      existing!.install_cost +
      existing!.demolition_cost +
      existing!.extra_cost +
      existing!.margin

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-800">
                견적서 v{existing!.version} 제출 완료
              </p>
              <p className="mt-1 text-sm text-green-700">고객에게 견적서가 전달되었습니다.</p>
            </div>
            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              v{existing!.version}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white p-3">
              <p className="text-xs text-gray-500">총 견적금액</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">
                {formatKrw(submittedTotal)}원
              </p>
            </div>
            <div className="rounded-xl bg-white p-3">
              <p className="text-xs text-gray-500">납기</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">
                {existing!.delivery_days != null ? `${existing!.delivery_days}일` : '미정'}
              </p>
            </div>
          </div>
          {existing!.note && (
            <p className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-600">{existing!.note}</p>
          )}
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="w-full rounded-xl border border-indigo-200 bg-white py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          수정 견적서 작성하기 (v{existing!.version + 1})
        </button>
      </div>
    )
  }

  // ── 편집 폼 (신규 / draft 이어서 / submitted 수정) ─────────────
  return (
    <div className="space-y-4">
      {isDraft && !isEditing && (
        <p className="rounded-lg bg-yellow-50 px-4 py-2 text-sm text-yellow-700">
          임시저장된 견적서가 있습니다.
        </p>
      )}
      {isEditing && isSubmitted && (
        <p className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
          v{existing!.version} 기준으로 수정 견적서를 작성합니다.
          고객에게 제출하면 v{existing!.version + 1}로 전달됩니다.
        </p>
      )}

      {/* 비용 항목 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-800">비용 항목 (원)</h3>
        <div className="space-y-3">
          {COST_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="w-20 flex-shrink-0 text-sm text-gray-600">{label}</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={costs[key] || ''}
                onChange={(e) =>
                  setCosts((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))
                }
                placeholder="0"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-right text-sm outline-none focus:border-indigo-400"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="font-semibold text-gray-800">총 견적금액</span>
          <span className="text-xl font-bold text-indigo-600">{formatKrw(total)}원</span>
        </div>
      </div>

      {/* 납기 + 메모 */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">납기 (일수)</label>
          <input
            type="number"
            min={1}
            value={deliveryDays}
            onChange={(e) => setDeliveryDays(e.target.value)}
            placeholder="예) 30"
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">메모 (선택)</label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="고객에게 전달할 메시지를 입력하세요"
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {errorMsg && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{errorMsg}</p>
      )}
      {successMsg && (
        <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{successMsg}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSaveDraft}
          disabled={isPending}
          className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {isPending ? '저장 중...' : '임시저장'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? '제출 중...' : '고객에게 제출하기'}
        </button>
      </div>

      {isEditing && (
        <button
          onClick={() => setIsEditing(false)}
          className="w-full rounded-xl border border-gray-100 py-2 text-xs text-gray-400 hover:text-gray-600"
        >
          취소 (현재 제출된 견적서로 돌아가기)
        </button>
      )}
    </div>
  )
}
