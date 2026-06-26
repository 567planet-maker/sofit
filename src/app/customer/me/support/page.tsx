import Link from 'next/link'
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui'

const FAQS = [
  {
    q: '견적은 어떻게 요청하나요?',
    a: '마이페이지 또는 상단의 “새 견적 요청” 버튼에서 현장 정보를 입력하면 소핏이 검증된 공장을 매칭해 드립니다.',
  },
  {
    q: '견적 비용이 드나요?',
    a: '견적 요청과 비교는 무료입니다. 계약 진행 시에만 공장과 협의된 금액이 발생합니다.',
  },
  {
    q: '공장과 직접 소통할 수 있나요?',
    a: '매칭이 완료되면 채팅 메뉴에서 담당 공장 및 소핏 매니저와 실시간으로 소통할 수 있습니다.',
  },
]

export default function SupportPage() {
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
          <CardTitle className="text-sm">문의하기</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-ink-muted">
            도움이 필요하시면 소핏 매니저에게 직접 문의해 주세요. 평일 10:00–18:00에 순차적으로 답변드립니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/customer/chat"
              className="rounded-control bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
            >
              채팅으로 문의
            </Link>
            <a
              href="mailto:support@sofit.kr"
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
