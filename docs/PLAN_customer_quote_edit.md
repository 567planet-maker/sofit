# 계획서: 고객 견적서 전달 + 공장 수정 견적 + 채팅 협상 시스템

## 목표

1. 고객이 제출한 견적 요청서(스펙·일정·현장 정보)가 **"고객 견적서"** 로 공장에게 명확히 전달된다.
2. 공장은 고객 견적서를 참조하면서 견적을 작성·제출한다.
3. 채팅을 통해 협의 후 공장이 **수정 견적서를 재제출**할 수 있다 (버전 관리).
4. 고객은 **버전별 변경 전·후**를 비교해서 볼 수 있다.
5. 최종 견적서가 확정된다.

---

## 문제 진단 (현재 상태)

```
[현재 흐름]
고객: 견적 요청서 제출 (스펙·일정·현장 정보) ──► DB: quote_requests
관리자: matches 생성
공장: /factory/requests/[id] 에서 데이터 보임
  └─ 현장정보·제품정보·규격·자재·일정이 "섹션"으로 표시됨
  └─ 그러나 "고객 견적서"라는 맥락 없이 나열됨
공장: factory_quotes 작성 (0에서 시작) → submitted 1회만 가능
고객: /customer/requests/[id]/quotes 에서 총액·납기만 확인
```

**핵심 문제 3가지**:
1. **고객 견적서가 안 보인다** — `quote_requests` 데이터가 공장 페이지에 있지만,
   "이것이 고객이 요청한 견적서입니다"라는 맥락이 없고,
   고객 본인도 자신이 제출한 견적 요청을 견적서 형태로 볼 수 없다.
2. **수정 견적 불가** — `submitFactoryQuote`가 draft 삭제 후 submitted 1개만 생성.
   한 번 제출하면 수정이 불가능하다.
3. **채팅과 견적이 분리** — 채팅방은 있지만 견적 협의 맥락이 없다.
   공장이 견적을 수정해도 고객이 무엇이 바뀌었는지 알 수 없다.

---

## 변경 후 흐름

```
[목표 흐름]
고객: 견적 요청서 제출 → "고객 견적서" (quote_requests)

공장: /factory/requests/[id]
  ├─ [고객 견적서 패널] — 스펙·일정·현장 정보를 "고객이 요청한 견적서" 제목으로 표시
  ├─ [견적서 작성/수정] — v1 작성·제출 가능
  └─ 제출 시 → 채팅방에 자동 메시지 "새 견적서(v1)를 보냈습니다" + 고객 알림

고객: /customer/requests/[id]
  ├─ [견적서 확인] 버튼 → /customer/requests/[id]/quotes
  └─ 채팅으로 수정 요청

공장: 채팅 확인 → /factory/requests/[id]에서 "견적 수정하기" 버튼
  └─ 수정 견적서(v2) 작성·제출 → 채팅에 "수정 견적서(v2)" 메시지

고객: /customer/requests/[id]/quotes
  ├─ v1 카드: [재료비 150,000 / 인건비 200,000 / ...]
  ├─ v2 카드: [재료비 140,000(-10,000↓) / 인건비 200,000(변동없음) / ...]  ← diff 표시
  └─ 최신 버전이 상단에 표시됨
```

---

## 변경 범위 (4단계)

---

### Phase 1 — DB 마이그레이션: factory_quotes 버전 관리

**파일**: `supabase/migrations/004_quote_versioning.sql`

현재 `submitFactoryQuote`는 draft 삭제 후 submitted 1개만 생성한다.
수정 견적을 지원하려면 **버전별 여러 개의 submitted 레코드**가 필요하다.

```sql
-- factory_quotes.status에 'superseded' 추가
-- (이전 버전임을 표시 — 최신 버전은 'submitted')
ALTER TABLE public.factory_quotes
  DROP CONSTRAINT factory_quotes_status_check;

ALTER TABLE public.factory_quotes
  ADD CONSTRAINT factory_quotes_status_check
  CHECK (status IN ('draft', 'submitted', 'superseded', 'accepted', 'rejected'));

-- is_latest 플래그 추가 (조회 단순화용)
ALTER TABLE public.factory_quotes
  ADD COLUMN is_latest boolean DEFAULT true;
```

**버전 관리 규칙**:
- 새 버전 제출 시: 기존 submitted → status='superseded', is_latest=false
- 신규 inserted: status='submitted', is_latest=true, version=N+1
- 조회: `is_latest=true AND status='submitted'` → 현재 견적
- 이력: `match_id` 기준 전체 조회 후 version 정렬

---

### Phase 2 — 고객 견적서 뷰 (양측 모두)

#### 2-1. 공장 측: "고객 견적서" 패널을 상단에 명시
**파일**: `src/app/factory/(protected)/requests/[id]/page.tsx`

현재 현장정보·제품정보 섹션이 페이지 하단에 나열됨.
이것을 **"고객 견적서"** 라는 제목의 섹션으로 재구성하여 견적서 작성 폼 **위에** 배치.

```
[페이지 레이아웃 변경]

1. 매칭 처리 (수락/거절)
2. ─────────────────────────────────
   고객 견적서                    ← 제목 변경
   ─────────────────────────────────
   [현장 정보] [제품 정보] [규격] [자재] [일정] [파일]
   (내용은 동일, 제목·맥락만 강화)

3. 공장 견적서 작성/수정           ← match.status === 'confirmed' 일 때만
```

#### 2-2. 고객 측: 자신의 견적 요청서 상단에 요약 카드 추가
**파일**: `src/app/customer/requests/[id]/page.tsx`

현재 고객 페이지에는 "견적서 확인" 버튼만 있고, 자신이 뭘 요청했는지 요약이 없음.
상단에 요약 카드 추가:

```
[내가 요청한 견적서 요약]
소파 형태: L자형   수량: 3개   납품 희망: 2026-07-15
원단: 패브릭       색상: 베이지
```

---

### Phase 3 — 공장 수정 견적 시스템

**파일**: `src/app/factory/(protected)/requests/[id]/QuoteForm.tsx`
**파일**: `src/app/app/actions/factory.ts`

#### 3-1. QuoteForm — 제출 완료 상태에서 "수정하기" 버튼 추가

현재 `isAlreadySubmitted`이면 완료 뷰만 보이고 수정 불가.
→ "수정 견적서 작성하기" 버튼 추가 → 클릭 시 편집 모드 진입 (기존 값 pre-fill)

```tsx
// 제출 완료 상태
if (isLatestSubmitted && !isEditing) {
  return (
    <div>
      {/* 현재 제출된 견적 요약 */}
      <p>v{existing.version} 견적서 제출 완료</p>
      <p>총액: {formatKrw(total)}원 / 납기: {existing.delivery_days}일</p>

      {/* 수정 버튼 */}
      <button onClick={() => setIsEditing(true)}>
        수정 견적서 작성하기
      </button>
    </div>
  )
}
// isEditing=true면 기존 폼 표시 (기존 값 pre-fill)
```

#### 3-2. `submitFactoryQuote` 서버 액션 수정

```ts
// factory.ts
export async function submitFactoryQuote(matchId, data): Promise<{ error?: string }> {
  // 1. 현재 submitted 버전 번호 조회
  const { data: latestQuote } = await supabase
    .from('factory_quotes')
    .select('id, version')
    .eq('match_id', matchId)
    .eq('is_latest', true)
    .maybeSingle()

  const nextVersion = (latestQuote?.version ?? 0) + 1

  // 2. 기존 submitted → superseded 처리
  if (latestQuote) {
    await supabase
      .from('factory_quotes')
      .update({ status: 'superseded', is_latest: false })
      .eq('id', latestQuote.id)
  }

  // 3. draft 삭제
  await supabase
    .from('factory_quotes')
    .delete()
    .eq('match_id', matchId)
    .eq('status', 'draft')

  // 4. 새 버전 insert
  await supabase.from('factory_quotes').insert({
    match_id: matchId,
    ...data,
    version: nextVersion,
    status: 'submitted',
    is_latest: true,
  })

  // 5. 채팅 메시지 자동 발송 (아래 Phase 4 참조)
  await sendQuoteRevisionChatMessage(matchId, nextVersion)

  // 6. 고객 알림
  // ... (기존 로직 유지, 메시지만 버전 포함으로 수정)
}
```

#### 3-3. page.tsx에서 QuoteForm에 버전 정보 전달

```ts
// 현재: 최신 견적서 1개만 조회
const { data: existingQuote } = await supabase
  .from('factory_quotes')
  .select('...')
  .eq('match_id', match.id)
  .eq('is_latest', true)
  .maybeSingle()

// QuoteForm에 전달 (기존 prop 유지)
<QuoteForm matchId={match.id} existing={existingQuote} />
```

---

### Phase 4 — 채팅 연계

**파일**: `src/app/actions/factory.ts` (내부 헬퍼)

견적서 제출·수정 시 `customer_factory` 채팅방에 시스템 메시지 자동 발송.

```ts
async function sendQuoteRevisionChatMessage(matchId: string, version: number) {
  const { data: room } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('match_id', matchId)
    .eq('type', 'customer_factory')
    .single()

  if (!room) return

  // 시스템 메시지 발신자 = 공장 user
  await supabase.from('chat_messages').insert({
    room_id: room.id,
    sender_id: factoryUserId,
    content: version === 1
      ? '견적서를 제출했습니다. 확인해 주세요.'
      : `수정 견적서(v${version})를 제출했습니다. 변경 내용을 확인해 주세요.`,
  })
}
```

채팅방 링크를 공장 페이지에도 추가:

```
[견적서 작성] 섹션 아래에
"고객과 채팅하기 →" 링크 (customer_factory 채팅방으로 이동)
```

---

### Phase 5 — 고객: 버전별 견적서 비교 뷰

**파일**: `src/app/customer/requests/[id]/quotes/page.tsx`

#### 5-1. 조회 쿼리 수정 — 전체 버전 조회

```ts
// 현재: status='submitted'인 1개만
// 변경: match별 모든 submitted + superseded 버전 조회, version 내림차순
const { data: quotes } = await supabase
  .from('factory_quotes')
  .select(`
    id, version, is_latest,
    material_cost, labor_cost, delivery_cost,
    install_cost, demolition_cost, extra_cost, margin,
    total_cost, delivery_days, note, status, created_at,
    matches!inner(
      id, status,
      factories!inner(id, company_name, location, rating_avg)
    )
  `)
  .eq('matches.request_id', requestId)
  .in('status', ['submitted', 'superseded'])
  .order('version', { ascending: false })
```

#### 5-2. 견적 카드 레이아웃 — 버전 diff 표시

각 공장의 최신 버전 카드 + "이전 버전 보기" 토글:

```
[삼성 소파 공장]                    최저가 배지
──────────────────────────────────────────────
수정 견적서 v2   2026-06-04         최신

견적 금액   560,000원  (v1: 580,000원 — 20,000원↓)
납기        28일       (v1: 30일 — 2일↓)

▼ 항목별 변경 내용 (v1 → v2)

항목         v1           v2          변동
재료비     150,000      150,000        —
인건비     200,000  →   180,000    -20,000 ↓
배송비      30,000       30,000        —
설치비          0            0          —
철거비          0            0          —
기타            0            0          —
마진       200,000  →   200,000        —
────────────────────────────────────────
합계       580,000  →   560,000    -20,000 ↓

[이전 버전(v1) 접기/펼치기]
```

**컬러 규칙**:
- 변동 없음: 회색
- 금액 감소: 초록 + ↓ (고객에게 유리)
- 금액 증가: 주황/빨강 + ↑

#### 5-3. 마진 항목 처리

마진을 고객에게 보여줄지 여부 결정 필요:
- **기본 계획**: 마진 포함 항목별 표시 (현재도 total_cost에 포함됨, 투명성 원칙)
- 대안: 마진은 숨기고 총액만 표시
- **구현 시 결정 필요** — 이 항목만 나중에 변경 가능

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|-----------|
| `supabase/migrations/004_quote_versioning.sql` | **신규** — `is_latest` 컬럼, `superseded` status 추가 |
| `src/app/actions/factory.ts` | `submitFactoryQuote` 버전 관리 로직 + 채팅 메시지 발송 |
| `src/app/factory/(protected)/requests/[id]/page.tsx` | "고객 견적서" 섹션 상단 재배치 |
| `src/app/factory/(protected)/requests/[id]/QuoteForm.tsx` | 제출 완료 상태에서 "수정하기" 버튼 + isEditing 상태 |
| `src/app/customer/requests/[id]/page.tsx` | 요청 요약 카드 추가 |
| `src/app/customer/requests/[id]/quotes/page.tsx` | 전체 버전 조회 + 버전별 diff 비교 UI |

---

## 구현 순서

1. `004_quote_versioning.sql` 작성 → Supabase 실행
2. `factory.ts` — `submitFactoryQuote` 버전 관리 + 채팅 연계 수정
3. `QuoteForm.tsx` — 제출 완료 후 수정하기 버튼 + isEditing 흐름
4. `factory/.../page.tsx` — 고객 견적서 섹션 레이아웃 재배치
5. `customer/.../quotes/page.tsx` — 버전 전체 조회 + diff 비교 UI
6. `customer/.../page.tsx` — 요청 요약 카드

---

## 엣지 케이스

1. **v1 밖에 없을 때**: diff 섹션 숨김, 단순 견적 카드만 표시
2. **여러 공장이 매칭된 경우**: 공장별로 각각 버전 관리, 공장별 카드로 분리
3. **draft 상태**: 고객에게 보이지 않음 (기존 동일)
4. **RLS**: `factory_quotes`의 공장 측 SELECT 정책에 `is_latest=false` 레코드도 포함 확인 필요
