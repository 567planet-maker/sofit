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
  scope: string | null
  note: string | null
  status: string
  version: number
}

type Props = {
  matchId: string
  itemId: string
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

export default function QuoteForm({ matchId, itemId, existing }: Props) {
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
  const [scope, setScope] = useState(existing?.scope ?? '')
  const [note, setNote] = useState(existing?.note ?? '')

  const total = Object.values(costs).reduce((sum, v) => sum + (v || 0), 0)

  const buildInput = (): QuoteInput => ({
    ...costs,
    delivery_days: deliveryDays ? Number(deliveryDays) : null,
    scope: scope || null,
    note: note || null,
  })

  const handleSaveDraft = () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    startTransition(async () => {
      const result = await saveQuoteDraft(matchId, itemId, buildInput())
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
      const result = await submitFactoryQuote(matchId, itemId, buildInput())
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
        <div className="rounded-card border border-green-200 bg-success-tint p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-green-800">
                견적서 v{existing!.version} 제출 완료
              </p>
              <p className="mt-1 text-sm text-success">고객에게 견적서가 전달되었습니다.</p>
            </div>
            <span className="rounded-full bg-success-tint px-3 py-1 text-xs font-medium text-success">
              v{existing!.version}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-card bg-white p-3">
              <p className="text-xs text-ink-muted">총 견적금액</p>
              <p className="mt-0.5 text-lg font-semibold text-ink">
                {formatKrw(submittedTotal)}원
              </p>
            </div>
            <div className="rounded-card bg-white p-3">
              <p className="text-xs text-ink-muted">납기</p>
              <p className="mt-0.5 text-lg font-semibold text-ink">
                {existing!.delivery_days != null ? `${existing!.delivery_days}일` : '미정'}
              </p>
            </div>
          </div>
          {existing!.scope && (
            <div className="mt-3 rounded-lg bg-white p-3">
              <p className="mb-1 text-xs font-medium text-ink-subtle">견적 상세 내용</p>
              <p className="whitespace-pre-wrap text-sm text-ink-muted">{existing!.scope}</p>
            </div>
          )}
          {existing!.note && (
            <p className="mt-3 rounded-lg bg-white p-3 text-sm text-ink-muted">{existing!.note}</p>
          )}
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="w-full rounded-card border border-brand-tint-strong bg-white py-3 text-sm font-medium text-brand hover:bg-brand-tint"
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
        <p className="rounded-lg bg-warning-tint px-4 py-2 text-sm text-warning">
          임시저장된 견적서가 있습니다.
        </p>
      )}
      {isEditing && isSubmitted && (
        <p className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
          v{existing!.version} 기준으로 수정 견적서를 작성합니다.
          고객에게 제출하면 v{existing!.version + 1}로 전달됩니다.
        </p>
      )}

      {/* 견적 상세 내용 */}
      <div className="rounded-card border border-border bg-white p-5 shadow-card">
        <label className="mb-1.5 block text-sm font-medium text-ink">견적 상세 내용</label>
        <p className="mb-2 text-xs text-ink-subtle">
          시공 범위·포함 항목·자재·조건 등을 적어주세요. 고객과 협의하며 수정 견적서로 바꿀 수 있습니다.
        </p>
        <textarea
          rows={5}
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="예) 거실 25㎡ 강마루 시공 / 기존 바닥 철거·평탄 작업 포함 / 걸레받이 별도 / 시공 후 2년 보증"
          className="w-full resize-none rounded-card border border-border px-4 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>

      {/* 비용 항목 */}
      <div className="rounded-card border border-border bg-white p-5 shadow-card">
        <h3 className="mb-4 font-medium text-ink">비용 항목 (원)</h3>
        <div className="space-y-3">
          {COST_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="w-20 flex-shrink-0 text-sm text-ink-muted">{label}</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={costs[key] || ''}
                onChange={(e) =>
                  setCosts((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))
                }
                placeholder="0"
                className="flex-1 rounded-card border border-border px-4 py-2.5 text-right text-sm outline-none focus:border-brand"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className="font-medium text-ink">총 견적금액</span>
          <span className="text-xl font-semibold text-brand">{formatKrw(total)}원</span>
        </div>
      </div>

      {/* 납기 + 메모 */}
      <div className="rounded-card border border-border bg-white p-5 shadow-card">
        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-ink">납기 (일수)</label>
          <input
            type="number"
            min={1}
            value={deliveryDays}
            onChange={(e) => setDeliveryDays(e.target.value)}
            placeholder="예) 30"
            className="w-full rounded-card border border-border px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">메모 (선택)</label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="고객에게 전달할 메시지를 입력하세요"
            className="w-full resize-none rounded-card border border-border px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
        </div>
      </div>

      {errorMsg && (
        <p className="rounded-lg bg-danger-tint px-4 py-2 text-sm text-danger">{errorMsg}</p>
      )}
      {successMsg && (
        <p className="rounded-lg bg-success-tint px-4 py-2 text-sm text-success">{successMsg}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSaveDraft}
          disabled={isPending}
          className="flex-1 rounded-card border border-border bg-white py-3 text-sm font-medium text-ink-muted hover:bg-surface-muted disabled:opacity-50"
        >
          {isPending ? '저장 중...' : '임시저장'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 rounded-card bg-brand py-3 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
        >
          {isPending ? '제출 중...' : '고객에게 제출하기'}
        </button>
      </div>

      {isEditing && (
        <button
          onClick={() => setIsEditing(false)}
          className="w-full rounded-card border border-border py-2 text-xs text-ink-subtle hover:text-ink-muted"
        >
          취소 (현재 제출된 견적서로 돌아가기)
        </button>
      )}
    </div>
  )
}
