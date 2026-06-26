'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/app/actions/profile'
import { Field, Input } from '@/components/ui'

export default function ProfileForm({
  email,
  name,
  phone,
}: {
  email: string | null
  name: string | null
  phone: string | null
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, null)

  return (
    <form action={formAction} className="space-y-1">
      <Field label="이메일" help="이메일은 변경할 수 없습니다.">
        <Input type="email" value={email ?? ''} disabled />
      </Field>
      <Field label="이름" htmlFor="name">
        <Input id="name" name="name" defaultValue={name ?? ''} placeholder="이름" required />
      </Field>
      <Field label="연락처" htmlFor="phone">
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={phone ?? ''}
          placeholder="010-0000-0000"
        />
      </Field>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-control bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover disabled:opacity-40"
        >
          {isPending ? '저장 중...' : '저장'}
        </button>
        {state?.success && <span className="text-sm text-success">저장되었습니다.</span>}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  )
}
