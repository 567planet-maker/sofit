// ============================================================
// SOFIT — RLS/IDOR 경계 검증 (실행 중인 Supabase 대상)
// anon key(공개)만 사용해 "인증 없이 남의 데이터가 보이는가"를 실제로 침투 시도한다.
// 정적 감사로는 확인 불가한 "RLS가 실제로 막는가"를 증명/회귀 방지.
//
// 실행:  node --env-file=.env.local scripts/verify-rls.mjs
// (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 필요 — 둘 다 공개 값)
// ============================================================

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.error('환경변수 없음: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('실행: node --env-file=.env.local scripts/verify-rls.mjs')
  process.exit(2)
}

// 인증하지 않은 anon 클라이언트 (= 로그인 안 한 외부인/봇)
const sb = createClient(url, anon, { auth: { persistSession: false } })

let pass = 0
let fail = 0
const results = []

function record(name, ok, detail) {
  results.push({ name, ok, detail })
  if (ok) pass++
  else fail++
}

// 보호 테이블: anon은 0행이어야 함(RLS 차단). 에러(권한 거부)도 차단으로 인정.
async function expectBlocked(table) {
  const { data, error } = await sb.from(table).select('*').limit(1)
  if (error) {
    record(`anon 차단: ${table}`, true, `error: ${error.code ?? error.message}`)
    return
  }
  const n = data?.length ?? 0
  record(`anon 차단: ${table}`, n === 0, n === 0 ? '0행' : `⚠️ ${n}행 노출됨`)
}

// 공개 데이터: anon이 읽을 수 있어야 함(에러 없이). 노출 의도된 것.
async function expectReadable(table, filter) {
  let q = sb.from(table).select('*').limit(1)
  if (filter) q = q.eq(filter.col, filter.val)
  const { error } = await q
  record(`공개 조회: ${table}`, !error, error ? `⚠️ error: ${error.message}` : 'ok')
}

// RPC: anon 직접 호출 차단(REVOKE)되어야 함 → 에러여야 PASS.
async function expectRpcDenied(fn, args) {
  const { error } = await sb.rpc(fn, args)
  record(`RPC 거부: ${fn}`, !!error, error ? `denied: ${error.code ?? error.message}` : '⚠️ 호출됨')
}

const PROTECTED = [
  'users',
  'customers',
  'quote_requests',
  'quote_request_items',
  'quote_request_attachments',
  'quote_request_revisions',
  'factory_quotes',
  'matches',
  'status_logs',
  'chat_rooms',
  'chat_messages',
  'notifications',
  'security_events',
  'rate_limits',
]

console.log(`\n▶ 대상: ${url}\n  anon key로 보호 테이블 침투 시도 (0행이어야 통과)\n`)

for (const t of PROTECTED) await expectBlocked(t)

// 공개 의도 데이터(정상 동작 확인)
await expectReadable('factories', { col: 'status', val: 'active' })
await expectReadable('factory_portfolios')

// rate limit RPC는 service_role 전용 — anon 호출 거부여야 함
await expectRpcDenied('check_rate_limit', {
  p_bucket: 'probe',
  p_identity: 'anon',
  p_max: 1,
  p_window_seconds: 60,
})

for (const r of results) {
  console.log(`  ${r.ok ? '✅ PASS' : '❌ FAIL'}  ${r.name}  — ${r.detail}`)
}

console.log(`\n결과: ${pass} PASS / ${fail} FAIL\n`)
process.exit(fail === 0 ? 0 : 1)
