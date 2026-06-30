// ============================================================
// 보안 이벤트 로깅 헬퍼 (migration 022 security_events)
// service_role로만 기록 — 'use server' 모듈/route handler에서만 import.
// 개인정보 최소: 이메일 등은 maskEmail로 마스킹해 넘긴다.
// ============================================================

import { createServiceClient } from '@/lib/supabase/server'

export type SecurityEventType =
  | 'rate_limited'
  | 'login_failed'
  | 'oauth_state_mismatch'

/**
 * 보안 이벤트를 기록한다. 실패해도 호출부 흐름을 막지 않는다(로그 기록은 best-effort).
 */
export async function logSecurityEvent(
  type: SecurityEventType,
  opts: {
    identity?: string | null
    ip?: string | null
    detail?: Record<string, unknown>
  } = {},
): Promise<void> {
  try {
    const db = createServiceClient()
    await db.from('security_events').insert({
      type,
      identity: opts.identity ?? null,
      ip: opts.ip ?? null,
      detail: opts.detail ?? null,
    })
  } catch (e) {
    console.error('[security-log] 기록 실패:', e instanceof Error ? e.message : e)
  }
}

/** 이메일을 부분 마스킹한다(앞 2글자 + 도메인 유지). 로그에 전체 이메일 저장 방지. */
export function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return '***'
  const local = email.slice(0, at)
  const domain = email.slice(at + 1)
  const head = local.slice(0, 2)
  return `${head}${'*'.repeat(Math.max(1, local.length - head.length))}@${domain}`
}
