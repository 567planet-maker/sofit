import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '이용약관',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link href="/" className="text-sm text-ink-subtle hover:text-ink-muted">
            ← 홈으로
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold text-ink">이용약관</h1>
          <p className="mb-8 text-sm text-ink-subtle">시행일: 2026년 6월 1일</p>

          <div className="space-y-8 text-sm leading-relaxed text-ink-muted">
            <section>
              <h2 className="mb-3 text-base font-medium text-ink">제1조 (목적)</h2>
              <p>
                본 약관은 소핏(이하 "회사")이 운영하는 인테리어 발주 매칭 플랫폼 소핏(sofit, 이하 "서비스")의
                이용과 관련하여 회사와 이용자 사이의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">제2조 (정의)</h2>
              <ul className="space-y-2 pl-4">
                <li>① "서비스"란 회사가 제공하는 인테리어 시공 견적 요청 및 공장 매칭 플랫폼 일체를 의미합니다.</li>
                <li>② "이용자"란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 모든 자를 말합니다.</li>
                <li>③ "고객"이란 견적 요청을 등록하는 이용자를 말합니다.</li>
                <li>④ "공장"이란 회사의 심사를 통과하여 견적서를 제출하는 파트너 사업자를 말합니다.</li>
                <li>⑤ "견적 요청"이란 고객이 시공 조건·규격·사진 등을 입력하여 제출하는 요청 문서를 말합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">제3조 (약관의 효력 및 변경)</h2>
              <ul className="space-y-2 pl-4">
                <li>① 본 약관은 서비스 화면에 게시함으로써 효력을 발생합니다.</li>
                <li>② 회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 적용 일자와 변경 사유를 명시하여 서비스 내 공지합니다.</li>
                <li>③ 변경된 약관은 공지 후 7일 이후부터 효력이 발생하며, 이용자가 변경 후 계속 서비스를 이용할 경우 변경된 약관에 동의한 것으로 봅니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">제4조 (서비스 이용계약의 체결)</h2>
              <ul className="space-y-2 pl-4">
                <li>① 이용계약은 이용자가 본 약관에 동의하고 소셜 로그인(카카오, 네이버)을 통해 회원가입을 완료한 시점에 성립합니다.</li>
                <li>② 회사는 다음 각 호에 해당하는 경우 이용신청을 거부하거나 사후에 이용계약을 해지할 수 있습니다.
                  <ul className="mt-2 space-y-1 pl-4">
                    <li>- 타인의 명의를 도용하거나 허위 정보를 기재한 경우</li>
                    <li>- 서비스 운영을 고의로 방해하거나 관련 법령을 위반한 경우</li>
                    <li>- 기타 회사가 정한 이용 기준에 적합하지 않은 경우</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">제5조 (서비스의 제공 및 변경)</h2>
              <ul className="space-y-2 pl-4">
                <li>① 회사는 다음 서비스를 제공합니다.
                  <ul className="mt-2 space-y-1 pl-4">
                    <li>- 인테리어 시공 견적 요청 접수 및 관리</li>
                    <li>- 검증된 파트너 공장 매칭</li>
                    <li>- 견적서 비교 및 채팅 기능</li>
                    <li>- 공장 포트폴리오 열람</li>
                  </ul>
                </li>
                <li>② 회사는 서비스의 내용을 변경하거나 중단할 수 있으며, 이 경우 사전에 서비스 내 공지합니다.</li>
                <li>③ 회사는 서비스의 품질 개선을 위해 점검 등으로 서비스 제공을 일시 중단할 수 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">제6조 (이용자의 의무)</h2>
              <ul className="space-y-2 pl-4">
                <li>① 이용자는 다음 행위를 해서는 안 됩니다.
                  <ul className="mt-2 space-y-1 pl-4">
                    <li>- 타인의 계정 및 개인정보를 도용하는 행위</li>
                    <li>- 허위 견적 요청을 등록하거나 공장에 허위 정보를 제공하는 행위</li>
                    <li>- 서비스를 통해 알게 된 거래 상대방 정보를 서비스 외부에서 직접 거래하는 데 사용하는 행위</li>
                    <li>- 음란물, 욕설, 혐오 표현 등 부적절한 콘텐츠를 게시하는 행위</li>
                    <li>- 회사의 사전 서면 동의 없이 서비스를 영리 목적으로 이용하는 행위</li>
                    <li>- 서비스의 안정적 운영을 방해하는 기술적 수단을 사용하는 행위</li>
                  </ul>
                </li>
                <li>② 이용자는 관련 법령, 본 약관 및 회사의 공지 사항을 준수하여야 합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">제7조 (게시물 및 업로드 파일)</h2>
              <ul className="space-y-2 pl-4">
                <li>① 이용자가 서비스에 업로드한 도면, 사진, 텍스트 등 콘텐츠의 저작권은 해당 이용자에게 귀속됩니다.</li>
                <li>② 이용자는 회사가 서비스 운영·개선·홍보 목적으로 해당 콘텐츠를 사용할 수 있도록 비독점적 라이선스를 회사에 부여합니다.</li>
                <li>③ 회사는 이용자가 업로드한 파일에 대해 무결성이나 저작권 침해 여부를 보증하지 않습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">제8조 (책임의 한계)</h2>
              <ul className="space-y-2 pl-4">
                <li>① 회사는 고객과 공장 간의 계약 체결 및 이행에 직접적으로 관여하지 않으며, 그로 인한 분쟁에 대해 책임을 지지 않습니다.</li>
                <li>② 회사는 서비스의 기술적 장애, 천재지변, 불가항력으로 인한 손해에 대해 책임을 지지 않습니다.</li>
                <li>③ 회사는 이용자가 서비스 내에 게시한 정보의 정확성·신뢰성에 대해 보증하지 않습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">제9조 (개인정보보호)</h2>
              <p>
                회사는 관련 법령에 따라 이용자의 개인정보를 보호합니다. 개인정보의 수집·이용·보관·파기 등에
                관한 사항은{' '}
                <Link href="/privacy" className="font-medium underline">개인정보처리방침</Link>
                에서 확인하실 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">제10조 (분쟁해결 및 준거법)</h2>
              <ul className="space-y-2 pl-4">
                <li>① 서비스 이용과 관련한 분쟁은 당사자 간 협의를 우선으로 합니다.</li>
                <li>② 협의로 해결되지 않는 경우 민사소송법에 의한 관할 법원에 소를 제기할 수 있습니다.</li>
                <li>③ 본 약관의 해석과 분쟁에 관해서는 대한민국 법률을 준거법으로 합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">제11조 (서비스 탈퇴 및 계정 삭제)</h2>
              <ul className="space-y-2 pl-4">
                <li>① 이용자는 언제든지 서비스 내 "계정 삭제" 기능을 통해 탈퇴를 요청할 수 있습니다.</li>
                <li>② 탈퇴 시 개인정보는 개인정보처리방침에서 정한 기간 동안 보관 후 파기됩니다.</li>
              </ul>
            </section>

            <div className="border-t border-surface-muted pt-6 text-xs text-ink-subtle">
              <p>본 약관은 2026년 6월 1일부터 시행됩니다.</p>
              <p className="mt-1">문의: 소핏 운영팀 (서비스 내 채팅)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
