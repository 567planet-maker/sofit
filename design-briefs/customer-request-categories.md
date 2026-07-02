# 견적 작성 — 27개 분야 폼 리디자인 브리프 (소핏 / SOFIT)

> 이 문서 하나만 클로드에게 넘기면 됩니다. 가운데 "견적 작성" 영역의 **분야별 폼(27개 전부)**을
> 다시 설계하기 위한 전체 정보(아키텍처 + 타입 시스템 + 27개 스키마 전량 + 제약)를 담았습니다.

---

## 0. 요청 (프롬프트로 사용)

소핏(SOFIT) 견적 스튜디오 가운데 "작성" 영역의 **27개 시공 분야 폼**을 리디자인해줘.

- 스택: **Next.js (App Router) + React + Tailwind CSS v4**. 폼은 `'use client'`.
- **핵심 아키텍처: 스키마 구동(schema-driven)**. 분야가 27개지만 폼을 렌더하는 컴포넌트는 **하나**(`CategorySection` → `DynamicField`)다. 각 분야는 `FIELD_SCHEMAS`의 데이터(필드 목록)로만 다르다.
  - **폼의 "생김새"를 바꾸려면** → `DynamicField`/위젯(공통) 한 곳. 27개에 일괄 적용.
  - **분야별 "내용(어떤 필드가 있는지)"을 바꾸려면** → `FIELD_SCHEMAS`의 해당 분야 데이터.
- **디자인 토큰만 사용**(임의 hex 금지). 방향(톤): **현재 톤 유지·개선** — 이미 적용된 리디자인(§2) 위에 얹어라. 갈아엎지 말 것.
- 아래 **"바꾸면 안 되는 것"의 데이터 계약(값 형태·키·검증)을 그대로 보존**할 것.
- 무엇을 원하는지 먼저 정하고 시작해라(§4에 A/B 갈림길).

---

## 1. 디자인 토큰 (globals.css `@theme` — 이것만 사용)

```css
/* Brand */ --color-brand:#0064FF; --brand-hover:#004FCC; --brand-tint:#E8F1FF; --brand-tint-strong:#C9DEFF;
/* Neutral */ --color-ink:#1A1F36; --ink-muted:#4F566B; --ink-subtle:#8792A2;
             --canvas:#F6F8FB; --surface:#FFFFFF; --surface-muted:#F0F3F8; --border:#E3E8EE; --border-strong:#D5DBE3;
/* Semantic */ --success:#1A7F64; --success-tint:#E6F4EF; --warning:#9A6700; --warning-tint:#FBF3E0; --danger:#E5484D; --danger-tint:#FDECEC;
/* Radius */ --radius-card:10px(rounded-card); --radius-control:6px(rounded-control); --radius-pill
/* Shadow */ --shadow-card; --shadow-card-hover; --shadow-pop
```
폰트: **Pretendard**(전역). 유틸리티 예: `bg-brand` `text-ink-muted` `border-border` `rounded-control`.

---

## 2. 이미 적용된 폼 비주얼 (기준선 — 이 위에 얹어라)

분야 섹션 카드(`CategorySection`)와 필드 위젯은 **최근에 리디자인 적용 완료** 상태다. 새 설계는 이걸 유지·개선한다.

- **분야 섹션 카드**: `rounded-card border border-border bg-white px-[30px] py-7 shadow-card`.
  헤더 = eyebrow(그룹명, brand 소문자 대문자화) + 분야명(18px bold) + `(filled/total 완료)` 분수 + 우측 "분야 제거"(hover 시 danger).
- **필드 그리드**: `grid-cols-1 gap-x-[22px] gap-y-5 sm:grid-cols-2`. `textarea`/`multiselect`/`address`는 `sm:col-span-2`(전폭).
- **필드 1개(`DynamicField`)**: 라벨 행[라벨(+필수 `*`) | "모름" pill] → help(있으면) → 위젯 → invalid 시 "필수 항목입니다."
- **위젯 스타일**(`.ctrl` 기준): 44px, `rounded-control`, 포커스 시 brand 보더 + 3px brand-tint 링.
  - select: 커스텀 화살표 / multiselect: 칩(active=brand) / boolean: 세그먼트(예·아니오) / area: 입력+평·㎡ 토글 / dimension: 가로×세로 mm / address: 도로명+상세 2입력.
- **"모름" 토글**: 라벨 우측 pill. 활성 시 위젯이 흐려지고(opacity 40) 비활성화됨.

---

## 3. 타입 시스템 (폼을 이해하려면 필수)

### 3-1. 필드 위젯 타입 `FieldType`
`text` · `textarea` · `tel` · `number`(+`unit`) · `select` · `multiselect` · `boolean`(예/아니오) · `date` · `dimension`(가로·세로 mm) · `address`(도로명+상세) · `area`(평↔㎡ 토글, 내부 ㎡ 저장)

### 3-2. 필드 정의 `FieldDef`
`{ key, label, type, required?, options?[{value,label}], unit?, placeholder?, help?, unknown? }`

### 3-3. "모름" 안전장치 `unknown` (전문용어 몰라도 넘어가게)
필드에 `unknown`이 있으면 라벨 옆 pill이 붙고, 켜면 값이 `{ __unknown:true, reason }`로 저장된다(= "고객이 모른다"는 사실까지 데이터로 보존, 검증도 통과).
- `unknown` = **잘 모름** / `consult` = **추천 요청** / `site_check` = **현장 확인** / `measure` = **실측 요청**

### 3-4. 값 형태 (⚠️ 절대 바꾸지 말 것)
- `dimension` → `{ width_mm, height_mm, depth_mm? }`
- `address` → `{ zipcode?, road?, detail?, lat?, lng? }`
- `area` → 숫자(㎡ 저장, UI만 평↔㎡)
- `multiselect` → `string[]` (option value 배열)
- `select`/`boolean`/`unknown` → 각각 문자열 / 불리언 / UnknownValue

### 3-5. 공통 말미 필드
모든 분야 끝에 `{ key:'note', label:'추가 메모', type:'textarea' }` 가 붙는다.

---

## 4. 무엇을 바꿀지 (시작 전 결정)

| 목표 | 손대는 곳 | 결과 |
|---|---|---|
| **A. 폼 UX/레이아웃 개선(공통)** | `DynamicField` + 위젯(§2) | 27개 전 분야 일괄 반영. 필드 구성은 그대로. |
| **B. 분야별 필드 내용 재설계** | `FIELD_SCHEMAS`의 각 분야 배열(§5) | 분야마다 필드/순서/옵션/필수/모름/help 재구성. |

> B를 할 때도 **데이터 키(`key`)·값 형태·`required` 검증 규칙**은 §6 제약을 지킨다.
> 특히 **`sofa`(쇼파·가구)의 필드 key는 레거시 DB 컬럼과 1:1 매핑**이라 이름 변경 금지.

---

## 5. 27개 분야 스키마 전량 (현재 상태 = 기준선)

표기: `key` 라벨 · type · **필수** · (unit) · [모름:mode] · {ph:…} · <help:…> · 옵션은 `값=라벨`.
그룹 순서 = 좌측 사이드바 정렬 순서. **모든 분야 끝에 `note`(추가 메모, textarea) 존재**(아래선 생략).

### 그룹 1. 철거·기초

**철거 `demolition`**
- `demo_scope` 철거 범위 · multiselect · **필수** · full=전체철거/wall=벽체/floor=바닥/ceiling=천장/bathroom=욕실/kitchen=주방
- `area` 철거 면적 · number · (m2)
- `structure_type` 구조 형태 · select · [모름:site_check] · <벽체 철거 시 구조 확인 필요> · masonry=조적/concrete=콘크리트/light_frame=경량/wood=목구조
- `asbestos` 석면 의심 자재 · select · [모름:site_check] · yes=있음/no=없음
- `debris_included` 폐기물 반출 포함 · boolean

**폐기물 처리 `waste`**
- `waste_types` 폐기물 종류 · multiselect · **필수** · construction=건축/household=생활/furniture=대형가구/appliance=폐가전/hazardous=위험물
- `volume` 예상 배출량 · select · [모름:consult] · under_1t=1톤미만/1_5t=1~5톤/over_5t=5톤이상
- `access` 반출 동선 · select · [모름:site_check] · elevator=엘리베이터/stairs=계단/ladder_truck=사다리차
- `urgent` 긴급 처리 · boolean

**설비(급배수·배관) `plumbing`**
- `work_items` 작업 항목 · multiselect · **필수** · supply=급수/drain=배수/heating_pipe=난방배관/gas=가스/fixture=위생기구
- `pipe_material` 배관 자재 · select · [모름:consult] · pb=PB/pvc=PVC/stainless=스테인리스/copper=동관
- `relocate` 배관 위치 이동 · boolean
- `boiler_included` 보일러 포함 · boolean
- `issue` 누수·막힘 문제 · select · [모름:site_check] · yes=있음/no=없음

**방수 `waterproofing`**
- `waterproof_area` 방수 부위 · multiselect · **필수** · bathroom=욕실/veranda=베란다/rooftop=옥상/kitchen=주방/basement=지하
- `method` 방수 공법 · select · [모름:consult] · membrane=도막/sheet=시트/complex=복합/penetrating=침투
- `area` 시공 면적 · number · (m2)
- `crack_repair` 균열 보수 포함 · boolean
- `existing_leak` 기존 누수 · select · [모름:site_check] · yes=있음/no=없음

### 그룹 2. 골조·목공

**목공 `carpentry`**
- `work_items` 작업 항목 · multiselect · **필수** · wall=가벽/ceiling=천장/molding=문틀·몰딩/frame=가구틀/partition=파티션/platform=단상
- `space` 작업 공간 · text · **필수** · {ph:예) 거실, 주방}
- `ceiling_type` 천장 형태 · select · flat=평천장/well=우물천장/indirect=간접
- `area` 면적/길이 · number · (m2)
- `finish_included` 마감 포함 · boolean
- `material_grade` 자재 등급 · select · [모름:consult] · <잘 모르시면 추천 요청> · normal=일반/e0=친환경 E0

**금속 `metal`**
- `work_items` 작업 항목 · multiselect · **필수** · railing=난간/stair=계단/frame=프레임/steel_door=철문/reinforce=구조보강
- `install_location` 설치 위치 · text · **필수**
- `material` 재질 · select · [모름:consult] · stainless=스테인리스/steel=철/aluminum=알루미늄/galvanized=아연도금
- `finish` 마감 · select · [모름:consult] · paint=도장/powder=분체도장/hairline=헤어라인
- `size` 규격 · dimension · (mm) · [모름:measure]

**유리 `glass`**
- `work_items` 작업 항목 · multiselect · **필수** · partition=파티션/door=도어/shower_booth=샤워부스/railing=난간/glass_wall=유리벽
- `glass_type` 유리 종류 · select · [모름:consult] · tempered=강화/laminated=접합/pair=복층/wired=망입/color=컬러
- `thickness` 두께 · select · [모름:consult] · 5=5mm/8=8mm/10=10mm/12=12mm
- `size` 규격 · dimension · (mm) · [모름:measure]
- `frame_included` 프레임 포함 · boolean

**창호 `window`**
- `window_type` 창호 종류 · select · **필수** · [모름:consult] · double=이중창/single=단창/system=시스템창/balcony=발코니창
- `count` 창 개수 · number · **필수** · (개)
- `frame_material` 프레임 재질 · select · [모름:consult] · pvc=PVC/aluminum=알루미늄/hybrid=하이브리드
- `glass_spec` 유리 사양 · select · [모름:consult] · pair=복층/triple=삼중/lowe=로이
- `size` 창 규격 · dimension · (mm) · [모름:measure]
- `remove_existing` 기존 창 철거 · boolean

**중문 `interior_door`**
- `door_type` 중문 형태 · select · **필수** · [모름:consult] · sliding=슬라이딩/swing=스윙/three_fold=3연동/folding=폴딩
- `count` 수량 · number · **필수** · (개)
- `material` 재질 · select · [모름:consult] · glass=유리/wood=목재/aluminum=알루미늄
- `frame_finish` 프레임 색상 · text · {ph:예) 화이트, 블랙, 우드}
- `size` 설치 규격 · dimension · (mm) · [모름:measure]

### 그룹 3. 마감

**바닥 `flooring`**
- `floor_material` 바닥재 종류 · select · **필수** · [모름:consult] · gangmaru=강마루/laminate=강화마루/hardwood=원목마루/sheet=장판/tile=타일/polishing=폴리싱/epoxy=에폭시/deco_tile=데코타일
- `area` 시공 면적 · number · **필수** · (m2)
- `remove_existing` 기존 바닥 철거 · boolean
- `pattern` 패턴/방향 · text
- `baseboard_included` 걸레받이 포함 · boolean
- `leveling_needed` 평탄 작업 필요 · boolean
- `heating_type` 난방 종류 · select · [모름:unknown] · water=온수/electric=전기/none=없음

**타일 `tile`**
- `tile_area` 시공 부위 · multiselect · **필수** · bathroom_wall=욕실벽/bathroom_floor=욕실바닥/kitchen=주방/entrance=현관/veranda=베란다/living=거실
- `area` 시공 면적 · number · **필수** · (m2)
- `tile_type` 타일 종류 · select · [모름:consult] · porcelain=자기질/ceramic=도기질/porcelain_large=포세린/mosaic=모자이크
- `tile_size` 타일 규격 · select · [모름:consult] · 300=300각/600=600각/600x1200=600x1200/etc=기타
- `remove_existing` 기존 타일 철거 · boolean

**도배 `wallpaper`**
- `wallpaper_type` 벽지 종류 · select · **필수** · [모름:consult] · silk=실크/paper=합지/flame_retardant=방염/mural=뮤럴
- `area` 시공 면적 · number · **필수** · (m2) · <벽면 기준 면적>
- `remove_existing` 기존 벽지 제거 · boolean
- `ceiling_included` 천장 포함 · boolean
- `color_pattern` 컬러/패턴 희망 · text
- `mold_area` 곰팡이·결로 부위 · select · [모름:site_check] · yes=있음/no=없음

**도장 `painting`**
- `paint_areas` 도장 부위 · multiselect · **필수** · wall=벽/ceiling=천장/door_molding=문·몰딩/exterior=외부/metal=철물
- `area` 면적 · number · **필수** · (m2)
- `paint_type` 페인트 종류 · select · [모름:consult] · water_based=수성/oil_based=유성/eco=친환경/waterproof=방수/special=특수
- `color` 색상 · text · [모름:consult] · {ph:지정 색상 또는 추천 요청}
- `putty_needed` 퍼티·바탕 작업 필요 · select · [모름:site_check] · yes=필요/no=불필요

**필름·시트 `film`**
- `film_areas` 시공 부위 · multiselect · **필수** · furniture=가구/door=문/wall=벽/window_frame=창틀/sink=싱크대
- `film_type` 필름 종류 · select · [모름:consult] · solid=단색/wood=우드/metal=메탈/marble=대리석/matte=무광
- `area` 시공 면적 · number · (m2)
- `existing_condition` 바탕 상태 · select · [모름:site_check] · flat=평탄/uneven=요철 있음
- `color` 희망 색상/패턴 · text

### 그룹 4. 설비·전기

**전기·배선 `electrical`**
- `work_items` 작업 항목 · multiselect · **필수** · wiring=배선/outlet=콘센트/switch=스위치/panel=분전반/network=통신/cctv=CCTV
- `outlet_add` 콘센트·스위치 추가 수량 · number · (개) · [모름:consult]
- `conceal` 배선 방식 · select · embedded=매립/exposed=노출
- `capacity_upgrade` 증설·승압 · boolean
- `panel_work` 분전반 교체 · boolean

**조명 `lighting`**
- `work_scope` 작업 범위 · select · **필수** · full_replace=전체교체/partial=부분/new=신규설치
- `space` 적용 공간 · text · **필수** · {ph:예) 거실, 침실}
- `light_types` 조명 종류 · multiselect · [모름:consult] · recessed=매입등/surface=직부/rail=레일/pendant=펜던트/indirect=간접/line=라인
- `count` 수량 · number · (개) · [모름:consult]
- `color_temp` 색온도 · select · [모름:consult] · warm=전구색/neutral=주백색/cool=주광색
- `smart_dimming` 디밍·스마트 · boolean

**냉난방 `hvac`**
- `equipment` 장비 종류 · multiselect · **필수** · system_ac=시스템에어컨/wall_ac=벽걸이/stand_ac=스탠드/boiler=보일러/ventilation=환기
- `count` 설치 수량 · number · (개)
- `capacity` 용량(평형) · select · [모름:consult] · 6=6평/9=9평/13=13평/18=18평
- `work_type` 작업 유형 · select · new=신규설치/relocate=이전설치/remove=철거
- `duct_work` 배관·타공 포함 · boolean

### 그룹 5. 공간 가구

**주방 `kitchen`**
- `work_scope` 작업 범위 · select · **필수** · full_replace=전체교체/partial=부분/sink_only=싱크대만
- `layout` 주방 형태 · select · **필수** · [모름:consult] · straight=일자형/l_shape=ㄱ자형/u_shape=ㄷ자형/island=아일랜드
- `cabinet_length` 상·하부장 길이 · number · (mm) · [모름:measure]
- `countertop` 상판 재질 · select · [모름:consult] · engineered=인조대리석/ceramic=세라믹/stainless=스테인리스
- `hood_cooktop` 후드·쿡탑 포함 · boolean
- `storage_needs` 수납 요구 · text

**욕실 `bathroom`**
- `work_scope` 작업 범위 · select · **필수** · full=전체/partial=부분
- `bathroom_count` 욕실 개수 · number · **필수** · (개)
- `replace_items` 교체 항목 · multiselect · toilet=변기/basin=세면대/bathtub=욕조/shower_booth=샤워부스/tile=타일/ceiling=천장
- `dry_wet` 건식/습식 · select · dry=건식/wet=습식
- `waterproof_included` 방수 포함 여부 · select · [모름:consult] · yes=포함/no=미포함
- `size` 욕실 사이즈 · dimension · (mm) · [모름:measure]

**붙박이·수납 `builtin`**
- `furniture_types` 가구 종류 · multiselect · **필수** · wardrobe=붙박이장/shoe_cabinet=신발장/pantry=팬트리/bookshelf=책장/storage_wall=수납벽/dressroom=드레스룸
- `location` 설치 위치 · text · **필수**
- `size` 규격 · dimension · (mm) · [모름:measure]
- `door_type` 도어 방식 · select · [모름:consult] · hinged=여닫이/sliding=슬라이딩/open=오픈
- `material` 자재 · select · [모름:consult] · pet=PET/veneer=무늬목/film=필름/paint=도장

### 그룹 6. 가구·소품

**쇼파·가구 `sofa`** ⚠️ 필드 key = 레거시 DB 컬럼(이름 변경 금지)
- `sofa_type` 형태 · select · **필수** · straight=직선형(1자)/l_shape=ㄱ자형/u_shape=ㄷ자형/round=원형/etc=기타
- `sofa_count` 수량 · number · **필수** · (개)
- `seat_count` 좌석 수 · number · (인)
- `backrest_height` 등받이 높이 · select · high=하이백(90cm↑)/mid=미디백(70~90cm)/low=로우백(~70cm)
- `cushion_type` 쿠션 타입 · select · spring=스프링/foam=폼/mixed=혼합
- `frame_structure` 프레임 구조 · select · wood=목재/metal=철재/mixed=혼합
- `fabric_type` 원단 종류 · select · [모름:consult] · fabric=패브릭/leather=천연가죽/faux_leather=인조가죽/velvet=벨벳/etc=기타
- `inner_material` 내부 충전재 · select · high_density_foam=고밀도폼/spring_foam=스프링+폼/cotton=솜/etc=기타
- `frame_material` 프레임 재질 · select · plywood=합판/solid_wood=원목/metal=철재/etc=기타
- `color_code` 색상 코드/색상명 · text · {ph:예) #F5F5DC, 베이지}
- `flame_retardant` 방염 처리 · boolean
- `waterproof` 방수 처리 · boolean
- `has_armrest` 팔걸이 · boolean
- `total_length` 전체 길이 · number · (mm)
- `total_width` 전체 폭 · number · (mm)
- `total_height` 전체 높이 · number · (mm)
- `seat_height` 좌면 높이 · number · (mm)
- `seat_depth` 좌면 깊이 · number · (mm)

**커튼·블라인드 `curtain`**
- `product_types` 제품 종류 · multiselect · **필수** · curtain=커튼/combi=콤비블라인드/roll=롤스크린/wood=우드블라인드/honeycomb=허니콤/blackout=암막
- `window_count` 창 개수 · number · **필수** · (개)
- `size` 창 규격 · dimension · (mm) · [모름:measure]
- `mount` 설치 방식 · select · [모름:site_check] · ceiling=천장/wall=벽면/frame=창틀
- `motorized` 전동 · boolean

**가전 `appliance`**
- `appliances` 가전 종류 · multiselect · **필수** · fridge=냉장고/washer=세탁기/dryer=건조기/dishwasher=식기세척기/induction=인덕션/oven=오븐/tv=TV
- `install_type` 설치 형태 · select · builtin=빌트인/standard=일반설치
- `count` 수량 · number · (개)
- `remove_old` 기존 가전 철거 · boolean
- `utility_needed` 전기·급배수 연결 필요 · boolean

### 그룹 7. 사인·외부

**간판 `signage`**
- `sign_types` 간판 종류 · multiselect · **필수** · front=전면간판/projecting=돌출간판/stand=입간판/window=윈도우시트/channel=채널
- `material` 재질 · select · [모름:consult] · acrylic=아크릴/led_channel=LED채널/galva=갈바/flex=플렉스
- `size` 규격 · dimension · (mm) · [모름:measure]
- `lighting` 조명 포함 · boolean
- `permit_needed` 인허가 대행 · boolean
- `design_provided` 디자인 보유 여부 · select · have=보유/request=제작요청

**사인물 `signboard`**
- `signboard_types` 사인물 종류 · multiselect · **필수** · indoor=실내사인/guide=유도사인/nameplate=명패/poster=포스터/sticker=스티커
- `quantity` 수량 · number · (개)
- `material` 재질 · select · [모름:consult] · acrylic=아크릴/forex=포맥스/metal=메탈/wood=우드/sheet=시트
- `size` 규격 · dimension · (mm) · [모름:measure]
- `design_provided` 디자인 보유 여부 · select · have=보유/request=제작요청

**조경·플랜테리어 `landscaping`**
- `scope` 작업 범위 · multiselect · **필수** · indoor_plant=실내플랜테리어/outdoor=실외조경/green_wall=벽면녹화/flower_bed=화단/tree=조경수/artificial_turf=인조잔디
- `location` 설치 위치 · text · **필수**
- `area` 면적 · number · (m2)
- `plant_preference` 선호 식물/스타일 · text · [모름:consult]
- `maintenance` 유지관리 포함 · boolean

### 그룹 8. 마무리

**청소 `cleaning`**
- `cleaning_type` 청소 종류 · select · **필수** · move_in=입주청소/post_construction=준공·리모델링후/office=사무실/move_out=이사청소
- `area` 청소 면적 · number · **필수** · (m2)
- `options` 추가 옵션 · multiselect · glass=유리/grout=줄눈/floor_wax=바닥왁스/mold=곰팡이제거/exterior=외부
- `desired_date` 희망일 · date

---

## 6. 바꾸면 안 되는 것 (데이터·계약 — 반드시 보존)

| 요소 | 이유 |
|---|---|
| 스키마 구동 구조 (`FIELD_SCHEMAS` + `getCategorySchema` + `DynamicField`) | 분야 추가/수정이 데이터만으로 되는 설계. 분야별 하드코딩 컴포넌트로 쪼개지 말 것. |
| `FieldType` 위젯 종류(§3-1)와 값 형태(§3-4) | 폼·상세뷰·제출검증이 공유. dimension/address/area/multiselect 값 구조 변경 금지. |
| `sofa`의 필드 `key` 이름 | 레거시 DB 컬럼과 1:1 매핑(Phase 6 이관). 이름 바꾸면 기존 데이터 깨짐. |
| `required` = 제출 검증 대상 | 서버 `submitQuoteDraft`가 required 미입력을 막고 하이라이트. 필수 지정은 신중히. |
| `unknown` 안전장치 4종(§3-3)과 `{__unknown, reason}` 값 | "고객이 모른다"를 데이터로 보존. 검증도 통과 처리. |
| 모든 분야 말미 `note`(추가 메모) | 자유 서술 여지. |
| 이미 적용된 폼 비주얼(§2)·토큰 | 그 위에 얹기. 갈아엎지 말 것. |

---

## 7. 개선해도 되는 것 (자유)
- **필드 구성·순서·그룹핑**: 분야 내 필드를 논리 블록(정보 블록)으로 묶기, 순서 최적화, 중복/과다 필드 정리.
- **라벨/help/placeholder 문구**를 더 쉽게(전문용어 완화), `unknown` 안전장치를 더 필요한 필드에 부여.
- **옵션 값의 label**(표시 문구) 다듬기 — 단, `value`(저장키)는 유지 권장(데이터 호환).
- **위젯 선택 개선**: 예) 자유 text로 받던 걸 select/multiselect로, 숫자를 area/dimension으로 등(값 형태 계약 준수 시).
- 공통(A) 폼 UX: 필드 밀도, 정보 블록 구획, 필수/선택 시각 구분, 모바일 1열 흐름, "모름" 어포던스.

---

## 8. 넘기지 않아도 되는 것
- 전체 코드베이스 / node_modules / 환경변수·시크릿
- 서버 액션 내부 구현(제출·검증 로직) — required·unknown 규칙만 알면 됨
- 공통 정보(common) 스키마 — 이 브리프는 **분야별 폼** 대상(공통 정보는 별도)
