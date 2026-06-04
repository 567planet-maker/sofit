'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { acceptFactoryQuote } from '@/app/actions/quote-request'

export type QuoteVersion = {
  id: string
  version: number
  is_latest: boolean
  material_cost: number
  labor_cost: number
  delivery_cost: number
  install_cost: number
  demolition_cost: number
  extra_cost: number
  margin: number
  total_cost: number
  delivery_days: number | null
  note: string | null
  status: string
  created_at: string
}

export type FactoryInfo = {
  id: string
  company_name: string
  location: string | null
  rating_avg: number
}

type Props = {
  factory: FactoryInfo
  quotes: QuoteVersion[] // version 내림차순 정렬 (index 0 = 최신)
  isLowest: boolean
  requestId: string
  matchId: string
  canAccept: boolean
}

const COST_FIELDS: { key: keyof Omit<QuoteVersion, 'id' | 'version' | 'is_latest' | 'total_cost' | 'delivery_days' | 'note' | 'status' | 'created_at'>; label: string }[] = [
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

function DiffCell({ diff }: { diff: number }) {
  if (diff === 0) return <span className="text-gray-300">—</span>
  if (diff > 0)
    return <span className="font-medium text-orange-500">+{formatKrw(diff)}원 ↑</span>
  return <span className="font-medium text-green-600">{formatKrw(diff)}원 ↓</span>
}

export default function QuoteVersionCard({ factory, quotes, isLowest, requestId, matchId, canAccept }: Props) {
  const [showDiff, setShowDiff] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [acceptError, setAcceptError] = useState<string | null>(null)

  const latest = quotes[0]
  const previous = quotes[1] ?? null
  const hasHistory = previous !== null
  const isAccepted = latest.status === 'accepted'

  const handleAccept = () => {
    setAcceptError(null)
    startTransition(async () => {
      const result = await acceptFactoryQuote(requestId, matchId)
      if (result.error) {
        setAcceptError(result.error)
        setConfirming(false)
      }
    })
  }

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        isAccepted
          ? 'border-indigo-400 ring-2 ring-indigo-300'
          : isLowest
          ? 'border-indigo-200 ring-1 ring-indigo-200'
          : 'border-gray-100'
      }`}
    >
      {isAccepted && (
        <span className="mb-3 inline-block rounded-full bg-indigo-600 px-2.5 py-0.5 text-xs font-medium text-white">
          계약 확정
        </span>
      )}
      {!isAccepted && isLowest && (
        <span className="mb-3 inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          최저가
        </span>
      )}

      {/* 버전 배지 */}
      {latest.version > 1 && (
        <span className="mb-3 ml-2 inline-block rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
          수정 견적서 v{latest.version}
        </span>
      )}

      {/* 공장 정보 */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">{factory.company_name}</p>
          {factory.location && (
            <p className="mt-0.5 text-sm text-gray-500">{factory.location}</p>
          )}
          {factory.rating_avg > 0 && (
            <p className="mt-0.5 text-sm text-yellow-600">
              ★ {factory.rating_avg.toFixed(1)}
            </p>
          )}
        </div>
        <Link
          href={`/portfolios?factory=${factory.id}`}
          className="flex-shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          포트폴리오 보기
        </Link>
      </div>

      {/* 총액·납기 요약 */}
      <div className="grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4">
        <div>
          <p className="text-xs text-gray-500">견적 금액</p>
          <p className="mt-0.5 text-lg font-bold text-gray-900">
            {formatKrw(latest.total_cost)}원
          </p>
          {previous && previous.total_cost !== latest.total_cost && (
            <p className="mt-0.5 text-xs">
              <DiffCell diff={latest.total_cost - previous.total_cost} />
              <span className="ml-1 text-gray-400">
                (v{previous.version}: {formatKrw(previous.total_cost)}원)
              </span>
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-gray-500">납기</p>
          <p className="mt-0.5 text-lg font-bold text-gray-900">
            {latest.delivery_days != null ? `${latest.delivery_days}일` : '미정'}
          </p>
          {previous &&
            previous.delivery_days !== latest.delivery_days &&
            previous.delivery_days != null && (
              <p className="mt-0.5 text-xs text-gray-400">
                v{previous.version}: {previous.delivery_days}일
              </p>
            )}
        </div>
      </div>

      {/* 메모 */}
      {latest.note && (
        <p className="mt-3 rounded-lg border border-gray-100 bg-white p-3 text-sm text-gray-600">
          {latest.note}
        </p>
      )}

      {/* 항목별 변경 내용 (이전 버전이 있을 때만) */}
      {hasHistory && (
        <div className="mt-4">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-700"
          >
            <span className="text-xs">{showDiff ? '▲' : '▼'}</span>
            {showDiff
              ? '항목별 비교 접기'
              : `항목별 변경 내용 (v${previous!.version} → v${latest.version})`}
          </button>

          {showDiff && (
            <div className="mt-3 overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-2 pl-4 text-left text-xs font-medium text-gray-500">
                      항목
                    </th>
                    <th className="py-2 text-right text-xs font-medium text-gray-500">
                      v{previous!.version}
                    </th>
                    <th className="py-2 text-right text-xs font-medium text-gray-500">
                      v{latest.version}
                    </th>
                    <th className="py-2 pr-4 text-right text-xs font-medium text-gray-500">
                      변동
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {COST_FIELDS.map(({ key, label }) => {
                    const prevVal = previous![key] as number
                    const currVal = latest[key] as number
                    const diff = currVal - prevVal
                    return (
                      <tr key={key} className={diff !== 0 ? 'bg-yellow-50/40' : ''}>
                        <td className="py-2 pl-4 text-gray-600">{label}</td>
                        <td className="py-2 text-right text-gray-400">
                          {prevVal > 0 ? `${formatKrw(prevVal)}원` : '—'}
                        </td>
                        <td className="py-2 text-right text-gray-800">
                          {currVal > 0 ? `${formatKrw(currVal)}원` : '—'}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <DiffCell diff={diff} />
                        </td>
                      </tr>
                    )
                  })}
                  {/* 합계 행 */}
                  <tr className="border-t border-gray-200 bg-gray-50 font-medium">
                    <td className="py-2.5 pl-4 text-gray-700">합계</td>
                    <td className="py-2.5 text-right text-gray-500">
                      {formatKrw(previous!.total_cost)}원
                    </td>
                    <td className="py-2.5 text-right text-gray-900">
                      {formatKrw(latest.total_cost)}원
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <DiffCell diff={latest.total_cost - previous!.total_cost} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-gray-400">
        {new Date(latest.created_at).toLocaleDateString('ko-KR')} 제출
      </p>

      {/* 수락 UI */}
      {isAccepted ? (
        <div className="mt-4 rounded-xl bg-indigo-50 px-4 py-3 text-center text-sm font-medium text-indigo-700">
          이 견적서로 계약이 확정되었습니다
        </div>
      ) : canAccept ? (
        confirming ? (
          <div className="mt-4 space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{factory.company_name}</span>의 견적서로
              계약을 확정하시겠습니까?
            </p>
            <p className="text-xs text-gray-500">
              확정 후에는 취소하기 어렵습니다. 소핏 담당자가 이후 진행을 안내드립니다.
            </p>
            {acceptError && (
              <p className="text-xs text-red-500">{acceptError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleAccept}
                disabled={isPending}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isPending ? '처리 중...' : '네, 계약 확정'}
              </button>
              <button
                onClick={() => { setConfirming(false); setAcceptError(null) }}
                disabled={isPending}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            이 견적서로 계약하기
          </button>
        )
      ) : null}
    </div>
  )
}
