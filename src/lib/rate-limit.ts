// ============================================================
// 서버 액션 Rate Limiting 헬퍼 (Postgres 고정 윈도)
// migration 021의 check_rate_limit() RPC를 service_role로 호출한다.
// 클라이언트에 노출 금지 — 'use server' 모듈에서만 import.
// ============================================================

import { headers } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'
import { logSecurityEvent } from '@/lib/security-log'

/**
 * 고정 윈도 rate limit 검사.
 * @returns true = 허용(통과), false = 한도 초과(차단)
 *
 * 설계: 가용성 우선(fail-open). 식별자가 없거나 RPC가 실패하면 통과시키되
 * 서버 로그만 남긴다. 제한기 장애가 서비스 전체를 막지 않도록 한다.
 */
export async function checkRateLimit(
  bucket: string,
  identity: string | null | undefined,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  if (!identity) return true
  const db = createServiceClient()
  const { data, error } = await db.rpc('check_rate_limit', {
    p_bucket: bucket,
    p_identity: identity,
    p_max: max,
    p_window_seconds: windowSeconds,
  })
  if (error) {
    console.error('[rate-limit] RPC 실패:', error.message)
    return true
  }
  const allowed = data === true
  // 한도 초과(차단)는 보안 이벤트로 기록 — 봇/brute force 탐지의 신호.
  if (!allowed) {
    await logSecurityEvent('rate_limited', {
      identity,
      detail: { bucket, max, windowSeconds },
    })
  }
  return allowed
}

/** 프록시 헤더에서 클라이언트 IP 추출 (미인증 흐름의 식별자). */
export async function getClientIp(): Promise<string | null> {
  const h = await headers()
  const xff = h.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || null
  return h.get('x-real-ip')
}
