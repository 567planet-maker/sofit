'use client'

import { useMemo, useState, useTransition } from 'react'
import { CATEGORY_GROUPS, type CategoryKey } from '@/app/customer/request/schema/categories'
import { setFactoryCategories } from '@/app/actions/factory'
import Button from '@/components/ui/Button'

export default function FactoryCategoryManager({
  initialSelected,
}: {
  initialSelected: CategoryKey[]
}) {
  const initialSet = useMemo(() => new Set(initialSelected), [initialSelected])
  const [selected, setSelected] = useState<Set<CategoryKey>>(new Set(initialSelected))
  const [savedSet, setSavedSet] = useState<Set<CategoryKey>>(initialSet)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const dirty =
    selected.size !== savedSet.size || [...selected].some((c) => !savedSet.has(c))

  function toggle(key: CategoryKey) {
    setMessage(null)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function save() {
    setMessage(null)
    const payload = [...selected]
    startTransition(async () => {
      const res = await setFactoryCategories(payload)
      if (res.error) {
        setMessage({ type: 'err', text: res.error })
        return
      }
      setSavedSet(new Set(payload))
      setMessage({ type: 'ok', text: '전문 분야가 저장되었습니다.' })
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-ink-muted">
        시공 가능한 분야를 모두 선택하세요. 선택한 분야의 견적 요청이 들어오면 매칭 대상이 됩니다.
        <span className="ml-1 font-medium text-ink">현재 {selected.size}개 선택됨</span>
      </p>

      <div className="flex flex-col gap-7">
        {CATEGORY_GROUPS.map((group) => (
          <section key={group.group}>
            <h2 className="mb-3 text-sm font-semibold text-ink">{group.group}</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {group.categories.map((cat) => {
                const on = selected.has(cat.key)
                return (
                  <button
                    key={cat.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(cat.key)}
                    className={
                      on
                        ? 'flex items-center gap-2 rounded-control border border-brand bg-brand-tint px-3.5 py-2.5 text-sm font-medium text-brand transition-colors'
                        : 'flex items-center gap-2 rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:border-border-strong hover:text-ink'
                    }
                  >
                    <span
                      className={
                        on
                          ? 'flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] bg-brand text-[10px] text-white'
                          : 'h-4 w-4 shrink-0 rounded-[5px] border border-border-strong'
                      }
                      aria-hidden
                    >
                      {on ? '✓' : ''}
                    </span>
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="sticky bottom-0 -mx-7 flex items-center justify-between gap-4 border-t border-border bg-surface/90 px-7 py-4 backdrop-blur">
        <div className="min-h-[1.25rem] text-sm">
          {message && (
            <span className={message.type === 'ok' ? 'text-success' : 'text-danger'}>
              {message.text}
            </span>
          )}
        </div>
        <Button onClick={save} disabled={!dirty || pending}>
          {pending ? '저장 중…' : '저장'}
        </Button>
      </div>
    </div>
  )
}
