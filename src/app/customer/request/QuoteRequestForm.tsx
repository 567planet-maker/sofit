'use client'

import { useState, useEffect, useTransition } from 'react'
import { submitQuoteRequest, type QuoteRequestDraft, type RequestFileInput } from '@/app/actions/quote-request'
import FileUploader, { type UploadedFile } from '@/components/common/FileUploader'

// ─── 타입 ───────────────────────────────────────────────────

type FormData = QuoteRequestDraft

const STORAGE_KEY = 'sofit_quote_draft'

const STEPS = [
  { id: 1, label: '현장 정보' },
  { id: 2, label: '제품 정보' },
  { id: 3, label: '규격·도면' },
  { id: 4, label: '자재·사진' },
  { id: 5, label: '일정·확인' },
]

const INITIAL: FormData = {
  company_name: '',
  contact: '',
  site_name: '',
  address: '',
  site_manager: '',
  available_time: '',
}

// ─── 헬퍼 컴포넌트 ───────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 block text-sm font-medium text-gray-700">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  )
}

function Input({
  label,
  required,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  required?: boolean
  error?: string
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <input
        {...props}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Select({
  label,
  required,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  required?: boolean
}) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <select
        {...props}
        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
      >
        {children}
      </select>
    </div>
  )
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean | null | undefined
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      {label}
    </label>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 font-semibold text-gray-900">{children}</h3>
}

// ─── 스텝 컴포넌트 ───────────────────────────────────────────

function Step1({
  data,
  errors,
  onChange,
}: {
  data: FormData
  errors: Partial<Record<keyof FormData, string>>
  onChange: (k: keyof FormData, v: unknown) => void
}) {
  return (
    <div className="space-y-5">
      <SectionTitle>현장 정보 (필수)</SectionTitle>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="업체명 / 시행사"
          required
          value={data.company_name}
          onChange={(e) => onChange('company_name', e.target.value)}
          error={errors.company_name}
          placeholder="예) (주)ABC인테리어"
        />
        <Input
          label="담당자 연락처"
          required
          type="tel"
          value={data.contact}
          onChange={(e) => onChange('contact', e.target.value)}
          error={errors.contact}
          placeholder="010-0000-0000"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="현장명"
          required
          value={data.site_name}
          onChange={(e) => onChange('site_name', e.target.value)}
          error={errors.site_name}
          placeholder="예) 부산 센텀 호텔 리노베이션"
        />
        <Input
          label="현장 담당자"
          required
          value={data.site_manager}
          onChange={(e) => onChange('site_manager', e.target.value)}
          error={errors.site_manager}
          placeholder="현장 담당자 이름"
        />
      </div>

      <Input
        label="현장 주소"
        required
        value={data.address}
        onChange={(e) => onChange('address', e.target.value)}
        error={errors.address}
        placeholder="도로명 주소 입력"
      />

      <Input
        label="방문 가능 시간"
        required
        value={data.available_time}
        onChange={(e) => onChange('available_time', e.target.value)}
        error={errors.available_time}
        placeholder="예) 평일 오전 9시~오후 6시"
      />

      <div className="rounded-xl bg-gray-50 p-4">
        <p className="mb-3 text-sm font-medium text-gray-600">추가 정보 (선택)</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="업종"
            value={data.business_type ?? ''}
            onChange={(e) => onChange('business_type', e.target.value || null)}
            placeholder="예) 호텔, 음식점, 오피스"
          />
          <Input
            label="층수"
            type="number"
            min={1}
            value={data.floor ?? ''}
            onChange={(e) =>
              onChange('floor', e.target.value ? Number(e.target.value) : null)
            }
            placeholder="층"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          <Checkbox
            label="주차 가능"
            checked={data.has_parking}
            onChange={(v) => onChange('has_parking', v)}
          />
          <Checkbox
            label="엘리베이터 있음"
            checked={data.has_elevator}
            onChange={(v) => onChange('has_elevator', v)}
          />
        </div>
      </div>
    </div>
  )
}

function Step2({
  data,
  onChange,
}: {
  data: FormData
  onChange: (k: keyof FormData, v: unknown) => void
}) {
  return (
    <div className="space-y-5">
      <SectionTitle>제품·쇼파 정보 (선택)</SectionTitle>
      <p className="text-sm text-gray-500">해당 사항이 있는 경우만 입력하세요.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="쇼파 형태"
          value={data.sofa_type ?? ''}
          onChange={(e) => onChange('sofa_type', e.target.value || null)}
        >
          <option value="">선택 안 함</option>
          <option value="직선형">직선형 (1자)</option>
          <option value="ㄱ자형">ㄱ자형</option>
          <option value="ㄷ자형">ㄷ자형</option>
          <option value="원형">원형</option>
          <option value="기타">기타</option>
        </Select>

        <Input
          label="쇼파 수량 (개)"
          type="number"
          min={1}
          value={data.sofa_count ?? ''}
          onChange={(e) =>
            onChange('sofa_count', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="예) 10"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="좌석 수 (인용)"
          type="number"
          min={1}
          value={data.seat_count ?? ''}
          onChange={(e) =>
            onChange('seat_count', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="예) 4"
        />

        <Select
          label="등받이 높이"
          value={data.backrest_height ?? ''}
          onChange={(e) => onChange('backrest_height', e.target.value || null)}
        >
          <option value="">선택 안 함</option>
          <option value="하이백">하이백 (90cm↑)</option>
          <option value="미디백">미디백 (70~90cm)</option>
          <option value="로우백">로우백 (~70cm)</option>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="쿠션 타입"
          value={data.cushion_type ?? ''}
          onChange={(e) => onChange('cushion_type', e.target.value || null)}
        >
          <option value="">선택 안 함</option>
          <option value="스프링">스프링</option>
          <option value="폼">폼</option>
          <option value="혼합">혼합</option>
        </Select>

        <Select
          label="프레임 구조"
          value={data.frame_structure ?? ''}
          onChange={(e) => onChange('frame_structure', e.target.value || null)}
        >
          <option value="">선택 안 함</option>
          <option value="목재">목재</option>
          <option value="철재">철재</option>
          <option value="혼합">혼합</option>
        </Select>
      </div>

      <div className="flex flex-wrap gap-4">
        <Checkbox
          label="방염 처리 필요"
          checked={data.flame_retardant}
          onChange={(v) => onChange('flame_retardant', v)}
        />
        <Checkbox
          label="방수 처리 필요"
          checked={data.waterproof}
          onChange={(v) => onChange('waterproof', v)}
        />
        <Checkbox
          label="팔걸이 있음"
          checked={data.has_armrest}
          onChange={(v) => onChange('has_armrest', v)}
        />
      </div>
    </div>
  )
}

function Step3({
  data,
  onChange,
  onFilesChange,
}: {
  data: FormData
  onChange: (k: keyof FormData, v: unknown) => void
  onFilesChange: (files: UploadedFile[]) => void
}) {
  return (
    <div className="space-y-5">
      <SectionTitle>규격 (선택)</SectionTitle>
      <p className="text-sm text-gray-500">단위: mm. 도면이 있으면 Step 4에서 업로드 가능합니다.</p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="전체 길이 (mm)"
          type="number"
          min={0}
          value={data.total_length ?? ''}
          onChange={(e) =>
            onChange('total_length', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="예) 2400"
        />
        <Input
          label="전체 폭 (mm)"
          type="number"
          min={0}
          value={data.total_width ?? ''}
          onChange={(e) =>
            onChange('total_width', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="예) 900"
        />
        <Input
          label="전체 높이 (mm)"
          type="number"
          min={0}
          value={data.total_height ?? ''}
          onChange={(e) =>
            onChange('total_height', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="예) 850"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="좌면 높이 (mm)"
          type="number"
          min={0}
          value={data.seat_height ?? ''}
          onChange={(e) =>
            onChange('seat_height', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="예) 450"
        />
        <Input
          label="좌면 깊이 (mm)"
          type="number"
          min={0}
          value={data.seat_depth ?? ''}
          onChange={(e) =>
            onChange('seat_depth', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="예) 550"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="벽 길이 (mm) — ㄱ/ㄷ자형"
          type="number"
          min={0}
          value={data.wall_length ?? ''}
          onChange={(e) =>
            onChange('wall_length', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="예) 1800"
        />
        <Input
          label="코너 각도 (°)"
          type="number"
          min={0}
          max={360}
          value={data.corner_angle ?? ''}
          onChange={(e) =>
            onChange('corner_angle', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="예) 90"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">도면 업로드 (선택)</p>
        <FileUploader
          bucket="request-documents"
          fileType="document"
          accept=".pdf,.dwg,.dxf"
          maxSizeMb={20}
          label="도면 파일을 드래그하거나 클릭하여 선택"
          hint="PDF, DWG, DXF 형식 지원"
          onChange={onFilesChange}
        />
      </div>
    </div>
  )
}

function Step4({
  data,
  onChange,
  onFilesChange,
}: {
  data: FormData
  onChange: (k: keyof FormData, v: unknown) => void
  onFilesChange: (files: UploadedFile[]) => void
}) {
  return (
    <div className="space-y-5">
      <SectionTitle>자재 정보 (선택)</SectionTitle>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="원단 종류"
          value={data.fabric_type ?? ''}
          onChange={(e) => onChange('fabric_type', e.target.value || null)}
        >
          <option value="">선택 안 함</option>
          <option value="패브릭">패브릭</option>
          <option value="가죽">천연 가죽</option>
          <option value="인조가죽">인조 가죽</option>
          <option value="벨벳">벨벳</option>
          <option value="기타">기타</option>
        </Select>

        <Select
          label="내부 충전재"
          value={data.inner_material ?? ''}
          onChange={(e) => onChange('inner_material', e.target.value || null)}
        >
          <option value="">선택 안 함</option>
          <option value="고밀도폼">고밀도 폼</option>
          <option value="스프링+폼">스프링 + 폼</option>
          <option value="솜">솜</option>
          <option value="기타">기타</option>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="프레임 재질"
          value={data.frame_material ?? ''}
          onChange={(e) => onChange('frame_material', e.target.value || null)}
        >
          <option value="">선택 안 함</option>
          <option value="합판">합판</option>
          <option value="원목">원목</option>
          <option value="철재">철재</option>
          <option value="기타">기타</option>
        </Select>

        <Input
          label="색상 코드 / 색상명"
          value={data.color_code ?? ''}
          onChange={(e) => onChange('color_code', e.target.value || null)}
          placeholder="예) #F5F5DC, 베이지"
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">매장·현장 사진 업로드 (권장)</p>
        <FileUploader
          bucket="request-images"
          fileType="image"
          accept=".jpg,.jpeg,.png,.webp"
          maxSizeMb={10}
          label="사진을 드래그하거나 클릭하여 선택"
          hint="JPG, PNG, WEBP 형식 지원"
          onChange={onFilesChange}
        />
      </div>
    </div>
  )
}

function Step5({
  data,
  onChange,
}: {
  data: FormData
  onChange: (k: keyof FormData, v: unknown) => void
}) {
  return (
    <div className="space-y-5">
      <SectionTitle>일정 정보 (선택)</SectionTitle>

      <div className="flex flex-wrap gap-4">
        <Checkbox
          label="실측 필요"
          checked={data.needs_measurement}
          onChange={(v) => onChange('needs_measurement', v)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {data.needs_measurement && (
          <Input
            label="실측 희망일"
            type="date"
            value={data.measurement_date ?? ''}
            onChange={(e) => onChange('measurement_date', e.target.value || null)}
          />
        )}
        <Input
          label="설치 소요 시간 (시간)"
          type="number"
          min={1}
          value={data.install_hours ?? ''}
          onChange={(e) =>
            onChange('install_hours', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="예) 8"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="제작 시작 희망일"
          type="date"
          value={data.production_start ?? ''}
          onChange={(e) => onChange('production_start', e.target.value || null)}
        />
        <Input
          label="제작 완료 희망일"
          type="date"
          value={data.production_end ?? ''}
          onChange={(e) => onChange('production_end', e.target.value || null)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="납품 희망일"
          type="date"
          value={data.delivery_date ?? ''}
          onChange={(e) => onChange('delivery_date', e.target.value || null)}
        />
        <Input
          label="설치 희망일"
          type="date"
          value={data.install_date ?? ''}
          onChange={(e) => onChange('install_date', e.target.value || null)}
        />
      </div>

      <Input
        label="A/S 가능 시작일"
        type="date"
        value={data.as_available_date ?? ''}
        onChange={(e) => onChange('as_available_date', e.target.value || null)}
      />

      {/* Summary */}
      <div className="rounded-xl bg-indigo-50 p-4">
        <p className="mb-3 text-sm font-semibold text-indigo-800">최종 확인</p>
        <div className="space-y-1.5 text-sm text-indigo-700">
          <p>
            <span className="font-medium">업체명:</span> {data.company_name}
          </p>
          <p>
            <span className="font-medium">현장명:</span> {data.site_name}
          </p>
          <p>
            <span className="font-medium">주소:</span> {data.address}
          </p>
          <p>
            <span className="font-medium">연락처:</span> {data.contact}
          </p>
          {data.sofa_type && (
            <p>
              <span className="font-medium">쇼파 형태:</span> {data.sofa_type}
              {data.sofa_count ? ` × ${data.sofa_count}개` : ''}
            </p>
          )}
          {data.delivery_date && (
            <p>
              <span className="font-medium">납품 희망일:</span> {data.delivery_date}
            </p>
          )}
        </div>
        <p className="mt-3 text-xs text-indigo-500">
          제출 후 소핏 담당자가 영업일 기준 1~2일 내 연락드립니다.
        </p>
      </div>
    </div>
  )
}

// ─── 메인 폼 컴포넌트 ────────────────────────────────────────

export default function QuoteRequestForm() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [documents, setDocuments] = useState<UploadedFile[]>([])
  const [images, setImages] = useState<UploadedFile[]>([])

  // localStorage 복구
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setFormData(JSON.parse(saved))
      }
    } catch {
      // 무시
    }
  }, [])

  // localStorage 자동 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData))
    } catch {
      // 무시
    }
  }, [formData])

  function handleChange(key: keyof FormData, value: unknown) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  function validateStep1(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.company_name.trim()) newErrors.company_name = '업체명을 입력하세요.'
    if (!formData.contact.trim()) newErrors.contact = '연락처를 입력하세요.'
    if (!formData.site_name.trim()) newErrors.site_name = '현장명을 입력하세요.'
    if (!formData.address.trim()) newErrors.address = '주소를 입력하세요.'
    if (!formData.site_manager.trim()) newErrors.site_manager = '현장 담당자를 입력하세요.'
    if (!formData.available_time.trim()) newErrors.available_time = '방문 가능 시간을 입력하세요.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return
    setStep((s) => Math.min(s + 1, 5))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSubmit() {
    setSubmitError(null)
    startTransition(async () => {
      const allFiles: RequestFileInput[] = [...documents, ...images]
      const result = await submitQuoteRequest(formData, allFiles)
      if (result && 'error' in result) {
        setSubmitError(result.error)
      } else {
        // redirect가 발생하므로 도달하지 않음
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          // 무시
        }
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* 프로그레스 바 */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          {STEPS.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  s.id < step
                    ? 'bg-indigo-600 text-white'
                    : s.id === step
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s.id < step ? '✓' : s.id}
              </div>
              <span
                className={`hidden text-xs sm:block ${
                  s.id === step ? 'font-semibold text-indigo-600' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="relative h-1.5 rounded-full bg-gray-100">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-center text-sm font-medium text-indigo-600 sm:hidden">
          {STEPS[step - 1].label}
        </p>
      </div>

      {/* 폼 */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
        {step === 1 && (
          <Step1 data={formData} errors={errors} onChange={handleChange} />
        )}
        {step === 2 && <Step2 data={formData} onChange={handleChange} />}
        {step === 3 && <Step3 data={formData} onChange={handleChange} onFilesChange={setDocuments} />}
        {step === 4 && <Step4 data={formData} onChange={handleChange} onFilesChange={setImages} />}
        {step === 5 && <Step5 data={formData} onChange={handleChange} />}

        {submitError && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{submitError}</div>
        )}

        {/* 네비게이션 버튼 */}
        <div className="mt-8 flex justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isPending}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              이전
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
            >
              {isPending ? '제출 중...' : '견적 요청 제출'}
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        입력 내용은 임시 저장됩니다. 새로고침 후에도 복구됩니다.
      </p>
    </div>
  )
}
