'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import FileUploader, { type UploadedFile } from '@/components/common/FileUploader'
import { createPortfolio, updatePortfolio, deletePortfolio } from '@/app/actions/factory'

type Portfolio = {
  id: string
  image_url: string
  description: string | null
  category: string | null
  completed_at: string | null
}

type Props = {
  portfolios: Portfolio[]
  supabaseUrl: string
}

const CATEGORY_LABELS: Record<string, string> = {
  sofa: '쇼파',
  builtin: '빌트인',
  other: '기타',
}

type FormState = {
  description: string
  category: 'sofa' | 'builtin' | 'other' | ''
  completed_at: string
}

const EMPTY_FORM: FormState = { description: '', category: '', completed_at: '' }

export default function PortfolioManager({ portfolios: initialPortfolios, supabaseUrl }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [portfolios, setPortfolios] = useState(initialPortfolios)

  // 모달 상태
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // 폼 상태
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const getPublicUrl = (path: string) => {
    if (path.startsWith('http')) return path
    return `${supabaseUrl}/storage/v1/object/public/factory-portfolios/${path}`
  }

  const handleAddSubmit = () => {
    if (!uploadedFile) {
      setErrorMsg('이미지를 업로드해주세요.')
      return
    }
    setErrorMsg(null)
    startTransition(async () => {
      const publicUrl = getPublicUrl(uploadedFile.path)
      const result = await createPortfolio({
        image_url: publicUrl,
        description: form.description || null,
        category: form.category || null,
        completed_at: form.completed_at || null,
      })
      if (result.error) {
        setErrorMsg(result.error)
      } else {
        setShowAdd(false)
        setForm(EMPTY_FORM)
        setUploadedFile(null)
        router.refresh()
      }
    })
  }

  const handleEditSubmit = () => {
    if (!editId) return
    setErrorMsg(null)
    startTransition(async () => {
      const result = await updatePortfolio(editId, {
        description: form.description || null,
        category: form.category || null,
        completed_at: form.completed_at || null,
      })
      if (result.error) {
        setErrorMsg(result.error)
      } else {
        setEditId(null)
        setForm(EMPTY_FORM)
        router.refresh()
      }
    })
  }

  const handleDelete = (id: string) => {
    setErrorMsg(null)
    startTransition(async () => {
      const result = await deletePortfolio(id)
      if (result.error) {
        setErrorMsg(result.error)
      } else {
        setDeleteId(null)
        setPortfolios((prev) => prev.filter((p) => p.id !== id))
        router.refresh()
      }
    })
  }

  const openEdit = (p: Portfolio) => {
    setForm({
      description: p.description ?? '',
      category: (p.category as FormState['category']) ?? '',
      completed_at: p.completed_at ?? '',
    })
    setEditId(p.id)
    setErrorMsg(null)
  }

  return (
    <div className="space-y-6">
      {/* 추가 버튼 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">등록된 작업 사례 {portfolios.length}개</p>
        <button
          onClick={() => {
            setShowAdd(true)
            setForm(EMPTY_FORM)
            setUploadedFile(null)
            setErrorMsg(null)
          }}
          className="rounded-card bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
        >
          + 작업 사례 추가
        </button>
      </div>

      {/* 추가 폼 */}
      {showAdd && (
        <div className="rounded-card border border-brand-tint-strong bg-brand-tint/30 p-5 shadow-card">
          <h3 className="mb-4 font-medium text-ink">새 작업 사례 등록</h3>
          <div className="space-y-4">
            <FileUploader
              bucket="factory-portfolios"
              fileType="image"
              accept=".jpg,.jpeg,.png,.webp"
              maxSizeMb={10}
              label="사진 업로드"
              hint="jpg, png, webp 형식"
              onChange={(files) => setUploadedFile(files[0] ?? null)}
            />
            <PortfolioFormFields form={form} onChange={setForm} />
            {errorMsg && (
              <p className="text-sm text-danger">{errorMsg}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleAddSubmit}
                disabled={isPending}
                className="flex-1 rounded-card bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-50"
              >
                {isPending ? '저장 중...' : '등록'}
              </button>
              <button
                onClick={() => { setShowAdd(false); setErrorMsg(null) }}
                disabled={isPending}
                className="flex-1 rounded-card border border-border bg-white py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-muted"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 포트폴리오 그리드 */}
      {portfolios.length === 0 && !showAdd ? (
        <div className="rounded-card border border-dashed border-border py-16 text-center">
          <p className="text-ink-subtle">등록된 작업 사례가 없습니다.</p>
          <p className="mt-1 text-sm text-ink-subtle">작업 사례를 등록하면 고객에게 노출됩니다.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {portfolios.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-card border border-border bg-white shadow-card">
              <div className="aspect-[4/3] overflow-hidden bg-surface-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image_url}
                  alt={p.description ?? '포트폴리오'}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                {/* 수정 폼 인라인 */}
                {editId === p.id ? (
                  <div className="space-y-3">
                    <PortfolioFormFields form={form} onChange={setForm} />
                    {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditSubmit}
                        disabled={isPending}
                        className="flex-1 rounded-lg bg-brand py-2 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => { setEditId(null); setErrorMsg(null) }}
                        className="flex-1 rounded-lg border border-border py-2 text-xs text-ink-muted hover:bg-surface-muted"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      {p.category && (
                        <span className="rounded-full bg-brand-tint px-2 py-0.5 text-xs font-medium text-brand">
                          {CATEGORY_LABELS[p.category] ?? p.category}
                        </span>
                      )}
                      {p.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{p.description}</p>
                      )}
                      {p.completed_at && (
                        <p className="mt-1 text-xs text-ink-subtle">{p.completed_at} 완료</p>
                      )}
                    </div>
                    {/* 삭제 확인 */}
                    {deleteId === p.id ? (
                      <div className="space-y-2 rounded-card bg-danger-tint p-3">
                        <p className="text-xs font-medium text-danger">삭제하시겠습니까?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={isPending}
                            className="flex-1 rounded-control bg-danger py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                          >
                            삭제
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="flex-1 rounded-lg border border-border py-1.5 text-xs text-ink-muted hover:bg-white"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="flex-1 rounded-lg border border-border py-1.5 text-xs text-ink-muted hover:bg-surface-muted"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="flex-1 rounded-lg border border-red-100 py-1.5 text-xs text-red-500 hover:bg-danger-tint"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PortfolioFormFields({
  form,
  onChange,
}: {
  form: FormState
  onChange: (f: FormState) => void
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">카테고리</label>
        <select
          value={form.category}
          onChange={(e) => onChange({ ...form, category: e.target.value as FormState['category'] })}
          className="w-full rounded-card border border-border px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">선택 안함</option>
          <option value="sofa">쇼파</option>
          <option value="builtin">빌트인</option>
          <option value="other">기타</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">설명</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="작업 내용을 간략히 설명해주세요"
          className="w-full resize-none rounded-card border border-border px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-muted">완료일</label>
        <input
          type="date"
          value={form.completed_at}
          onChange={(e) => onChange({ ...form, completed_at: e.target.value })}
          className="w-full rounded-card border border-border px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>
    </div>
  )
}
