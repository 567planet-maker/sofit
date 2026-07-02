# 디자인 브리프 (Design Briefs)

클로드(또는 다른 디자이너)에게 **페이지/컴포넌트 리디자인을 맡길 때 넘기는 자료**를 모아두는 폴더.
각 파일은 "이 문서 하나만 넘기면 되는" 자립형 브리프다.

## 작성 규칙
- 한 파일 = 한 화면(또는 한 컴포넌트) 리디자인.
- 파일명: 대상 경로 기준 kebab-case (예: 로그인 → `login.md`, 견적요청 → `customer-request-new.md`).
- 새 브리프는 [`_TEMPLATE.md`](./_TEMPLATE.md)를 복사해서 채운다.
- 공통 디자인 토큰은 매번 붙여넣지 말고 필요 시 [`../src/app/globals.css`](../src/app/globals.css)의 `@theme` 블록을 참조/복사.

## 목록
| 대상 | 파일 | 상태 |
|---|---|---|
| 로그인 (`/login`) | [login.md](./login.md) | 적용 완료 |
| 견적 요청 작성 스튜디오 (`/customer/request` → `/customer/request/[id]`) | [customer-request.md](./customer-request.md) | 적용 완료 |
| 견적 작성 — 27개 분야 폼 (schema-driven) | [customer-request-categories.md](./customer-request-categories.md) | 작성됨 |
| 컬러 시스템 전면 교체 (앱+랜딩 전체) | [color-system.md](./color-system.md) | 참조 문서 |

> 새 브리프를 추가하면 이 표에 한 줄 추가할 것.
