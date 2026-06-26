import Link from 'next/link'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui'

const FAQS = [
  {
    q: '매칭 요청은 어떻게 받나요?',
    a: '“공장관리 > 매칭 요청”에서 소핏이 연결한 견적 요청을 확인하고 참여할 수 있습니다.',
  },
  {
    q: '견적서는 어디서 보내나요?',
    a: '매칭된 요청 상세에서 자재비·인건비 등을 입력해 견적서를 제출하면 고객에게 전달됩니다.',
  },
  {
    q: '포트폴리오는 어떻게 등록하나요?',
    a: '“공장관리 > 포트폴리오”에서 시공 사례 사진과 설명을 등록하면 업체찾기 페이지에 노출됩니다.',
  },
]

export default function FactorySupportPage() {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">자주 묻는 질문</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          {FAQS.map((f) => (
            <div key={f.q} className="border-b border-border pb-4 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-ink">Q. {f.q}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{f.a}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">파트너 문의</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-ink-muted">
            운영·정산·매칭 관련 문의는 소핏 파트너 매니저에게 연락해 주세요. 평일 10:00–18:00에 답변드립니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/factory/chat"
              className="rounded-control bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
            >
              채팅으로 문의
            </Link>
            <a
              href="mailto:partners@sofit.kr"
              className="rounded-control border border-border bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              이메일 문의
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
