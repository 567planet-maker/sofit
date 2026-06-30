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

// ── 실시간 알림 임계치 (최근 ALERT_WINDOW_MINUTES분 내 동일 type+identity 누적) ──
const ALERT_THRESHOLDS: Partial<Record<SecurityEventType, number>> = {
  login_failed: 10,
  rate_limited: 20,
}
const ALERT_WINDOW_MINUTES = 10

type ServiceDb = ReturnType<typeof createServiceClient>

/**
 * 보안 이벤트를 기록하고, 임계치 초과 시 webhook 알림을 보낸다.
 * 실패해도 호출부 흐름을 막지 않는다(best-effort).
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
    await maybeAlert(db, type, opts)
  } catch (e) {
    console.error('[security-log] 기록 실패:', e instanceof Error ? e.message : e)
  }
}

/**
 * 고위험 이벤트는 즉시, 누적형 이벤트는 임계치 도달 시 1회 webhook 알림.
 * SECURITY_ALERT_WEBHOOK_URL 미설정 시 아무것도 하지 않는다(fail-soft).
 */
async function maybeAlert(
  db: ServiceDb,
  type: SecurityEventType,
  opts: { identity?: string | null; ip?: string | null },
): Promise<void> {
  const url = process.env.SECURITY_ALERT_WEBHOOK_URL
  if (!url) return

  // OAuth state 위조는 드물고 신호가 강해 즉시 통지.
  if (type === 'oauth_state_mismatch') {
    await sendWebhookAlert(url, `🚨 [SOFIT] OAuth state 위조 의심 (ip=${opts.ip ?? '?'})`)
    return
  }

  const threshold = ALERT_THRESHOLDS[type]
  if (!threshold || !opts.identity) return

  const since = new Date(Date.now() - ALERT_WINDOW_MINUTES * 60 * 1000).toISOString()
  const { count } = await db
    .from('security_events')
    .select('*', { count: 'exact', head: true })
    .eq('type', type)
    .eq('identity', opts.identity)
    .gte('created_at', since)

  // 임계치에 "도달한 순간" 1회만 알림(이후 같은 윈도에선 중복 발송 안 함).
  if ((count ?? 0) === threshold) {
    await sendWebhookAlert(
      url,
      `🚨 [SOFIT] ${type} ${threshold}회 초과 — identity=${opts.identity} (최근 ${ALERT_WINDOW_MINUTES}분)`,
    )
  }
}

/** Slack 호환 incoming webhook으로 알림 전송(Discord는 text→content로 바꿔야 함). */
async function sendWebhookAlert(url: string, text: string): Promise<void> {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch (e) {
    console.error('[security-log] 알림 전송 실패:', e instanceof Error ? e.message : e)
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
