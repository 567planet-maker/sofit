import { cn } from '@/lib/utils/cn'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

const SIZES: Record<AvatarSize, string> = {
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-sm',
  lg: 'w-[52px] h-[52px] text-lg',
  xl: 'w-[72px] h-[72px] text-2xl',
}

/** 프로필 사진. src 있으면 이미지, 없으면 이름 첫 글자 fallback */
export default function Avatar({
  src,
  name,
  size = 'md',
  className,
}: {
  src?: string | null
  name?: string | null
  size?: AvatarSize
  className?: string
}) {
  const initial = (name ?? '?').trim().charAt(0) || '?'
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? ''}
        className={cn('shrink-0 rounded-full object-cover ring-1 ring-ink/5', SIZES[size], className)}
      />
    )
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-tint font-semibold text-brand',
        SIZES[size],
        className,
      )}
    >
      {initial}
    </span>
  )
}
