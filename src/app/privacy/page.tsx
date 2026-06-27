import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '개인정보처리방침',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-canvas px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link href="/" className="text-sm text-ink-subtle hover:text-ink-muted">
            ← 홈으로
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-semibold text-ink">개인정보처리방침</h1>
          <p className="mb-8 text-sm text-ink-subtle">시행일: 2026년 6월 1일</p>

          <div className="space-y-8 text-sm leading-relaxed text-ink-muted">
            <p>
              소핏(이하 "회사")은 개인정보 보호법 및 관련 법령을 준수하며, 이용자의 개인정보를 안전하게 보호합니다.
              본 방침은 회사가 수집하는 개인정보의 항목, 수집·이용 목적, 보유 기간, 파기 방법 등을 안내합니다.
            </p>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">1. 수집하는 개인정보 항목</h2>
              <div className="space-y-3">
                <div>
                  <p className="mb-1 font-medium text-ink">가. 회원가입 시 (소셜 로그인)</p>
                  <ul className="space-y-1 pl-4">
                    <li>- 카카오: 카카오 계정 고유 ID, 이메일(선택), 닉네임(선택)</li>
                    <li>- 네이버: 네이버 계정 고유 ID, 이메일(선택), 이름(선택)</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-medium text-ink">나. 견적 요청 시</p>
                  <ul className="space-y-1 pl-4">
                    <li>- 업체명, 현장 주소, 담당자명, 연락처</li>
                    <li>- 현장 사진, 도면 파일(jpg, png, pdf, dwg, dxf)</li>
                    <li>- 소파 규격·자재 정보, 시공 일정 희망일</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-medium text-ink">다. 공장 입점 신청 시</p>
                  <ul className="space-y-1 pl-4">
                    <li>- 회사명, 소재지, 사업자등록번호</li>
                    <li>- 사업자등록증 사본(pdf, jpg)</li>
                    <li>- 포트폴리오 이미지</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-medium text-ink">라. 서비스 이용 과정에서 자동 수집</p>
                  <ul className="space-y-1 pl-4">
                    <li>- IP 주소, 접속 일시, 서비스 이용 기록</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">2. 개인정보의 수집 및 이용 목적</h2>
              <ul className="space-y-2 pl-4">
                <li>① 회원 식별 및 서비스 이용 계약 이행</li>
                <li>② 견적 요청 처리 및 파트너 공장 매칭</li>
                <li>③ 견적서 전달, 채팅, 알림 등 서비스 운영</li>
                <li>④ 공장 입점 심사 및 관리</li>
                <li>⑤ 부정이용 방지 및 보안 관리</li>
                <li>⑥ 서비스 개선을 위한 통계 분석 (비식별 처리)</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">3. 개인정보의 보유 및 이용 기간</h2>
              <p className="mb-3">
                원칙적으로 개인정보 수집·이용 목적이 달성된 후에는 지체 없이 파기합니다. 단, 관련 법령에 의해 보존할
                필요가 있는 경우 아래와 같이 보관합니다.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-canvas text-left">
                      <th className="border border-border px-3 py-2 font-medium">보유 항목</th>
                      <th className="border border-border px-3 py-2 font-medium">보유 기간</th>
                      <th className="border border-border px-3 py-2 font-medium">근거 법령</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border px-3 py-2">계약·청약 철회 기록</td>
                      <td className="border border-border px-3 py-2">5년</td>
                      <td className="border border-border px-3 py-2">전자상거래법</td>
                    </tr>
                    <tr>
                      <td className="border border-border px-3 py-2">대금 결제·공급 기록</td>
                      <td className="border border-border px-3 py-2">5년</td>
                      <td className="border border-border px-3 py-2">전자상거래법</td>
                    </tr>
                    <tr>
                      <td className="border border-border px-3 py-2">소비자 불만·분쟁 기록</td>
                      <td className="border border-border px-3 py-2">3년</td>
                      <td className="border border-border px-3 py-2">전자상거래법</td>
                    </tr>
                    <tr>
                      <td className="border border-border px-3 py-2">접속 로그</td>
                      <td className="border border-border px-3 py-2">3개월</td>
                      <td className="border border-border px-3 py-2">통신비밀보호법</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">4. 개인정보의 파기</h2>
              <ul className="space-y-2 pl-4">
                <li>① 전자파일 형태의 정보는 복구 불가능한 방법으로 영구 삭제합니다.</li>
                <li>② 종이 문서는 분쇄 또는 소각하여 파기합니다.</li>
                <li>③ 회원 탈퇴 요청 시, 보유 의무 기간이 없는 개인정보는 즉시 삭제합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">5. 개인정보의 제3자 제공</h2>
              <p className="mb-2">
                회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래 경우는 예외입니다.
              </p>
              <ul className="space-y-2 pl-4">
                <li>① 이용자가 사전에 동의한 경우</li>
                <li>② 법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차에 따라 요청받은 경우</li>
                <li>③ 서비스 내 매칭된 공장에 견적 요청 처리를 위해 최소한의 정보를 제공하는 경우 (업체명, 현장 주소, 연락처, 도면·사진)</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">6. 개인정보처리의 위탁</h2>
              <p className="mb-3">회사는 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁합니다.</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-canvas text-left">
                      <th className="border border-border px-3 py-2 font-medium">수탁업체</th>
                      <th className="border border-border px-3 py-2 font-medium">위탁 업무</th>
                      <th className="border border-border px-3 py-2 font-medium">위탁 기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border px-3 py-2">Supabase Inc.</td>
                      <td className="border border-border px-3 py-2">DB 저장·인증·파일 보관 (일본 도쿄 리전)</td>
                      <td className="border border-border px-3 py-2">서비스 종료 시</td>
                    </tr>
                    <tr>
                      <td className="border border-border px-3 py-2">Vercel Inc.</td>
                      <td className="border border-border px-3 py-2">웹 서버 호스팅</td>
                      <td className="border border-border px-3 py-2">서비스 종료 시</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">7. 국외 이전</h2>
              <p>
                회사는 서비스 운영을 위해 이용자의 개인정보를 해외(일본, 미국)에 소재한 서버에 저장·처리합니다.
                해당 서버들은 각 국가의 데이터 보호 법규를 준수하며, 회사는 이전되는 정보의 안전한 관리를 위해
                표준 계약 조항 등 적절한 안전장치를 활용합니다.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">8. 정보주체의 권리</h2>
              <p className="mb-2">이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
              <ul className="space-y-2 pl-4">
                <li>① 개인정보 열람 요청</li>
                <li>② 오류 정정 요청</li>
                <li>③ 삭제 요청 (탈퇴: 서비스 내 "계정 삭제" 메뉴)</li>
                <li>④ 처리 정지 요청</li>
              </ul>
              <p className="mt-3">
                위 권리 행사는 서비스 내 채팅 또는 이메일로 문의하시면 지체 없이 처리합니다.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">9. 쿠키 및 자동 수집 도구</h2>
              <ul className="space-y-2 pl-4">
                <li>① 서비스는 로그인 세션 유지를 위해 쿠키를 사용합니다.</li>
                <li>② 브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 이 경우 로그인이 불가능합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">10. 개인정보보호 책임자</h2>
              <div className="rounded-lg bg-canvas p-4">
                <p className="font-medium text-ink">소핏 운영팀</p>
                <p className="mt-1 text-ink-subtle">문의: 서비스 내 채팅</p>
                <p className="text-ink-subtle">처리 기간: 영업일 기준 3일 이내</p>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-base font-medium text-ink">11. 권리구제 방법</h2>
              <p>
                개인정보 침해로 인한 피해를 구제받기 위해 아래 기관에 분쟁 해결 또는 상담을 신청할 수 있습니다.
              </p>
              <ul className="mt-2 space-y-1 pl-4">
                <li>- 개인정보 분쟁조정위원회: privacy.go.kr / 1833-6972</li>
                <li>- 개인정보침해신고센터: privacy.kisa.or.kr / 국번없이 118</li>
                <li>- 경찰청 사이버수사국: ecrm.cyber.go.kr / 182</li>
              </ul>
            </section>

            <div className="border-t border-surface-muted pt-6 text-xs text-ink-subtle">
              <p>본 방침은 2026년 6월 1일부터 시행됩니다.</p>
              <p className="mt-1">이전 버전의 개인정보처리방침은 문의를 통해 확인하실 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
