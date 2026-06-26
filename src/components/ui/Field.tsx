import { cn } from '@/lib/utils/cn'

const CTRL =
  'w-full rounded-control border border-border-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-subtle transition focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/20 disabled:bg-surface-muted disabled:text-ink-subtle'

export function Label({ className, children, required, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn('mb-1.5 block text-[13px] font-medium text-ink', className)} {...props}>
      {children}
      {required && <span className="ml-0.5 text-danger">*</span>}
    </label>
  )
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CTRL, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CTRL, 'min-h-20 resize-y py-2.5', className)} {...props} />
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CTRL, 'h-10 appearance-none bg-no-repeat pr-9', className)} {...props}>
      {children}
    </select>
  )
}

/** label + control + help/error 묶음 */
export function Field({
  label,
  required,
  help,
  error,
  htmlFor,
  children,
  className,
}: {
  label?: React.ReactNode
  required?: boolean
  help?: React.ReactNode
  error?: React.ReactNode
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4', className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      ) : help ? (
        <p className="mt-1.5 text-xs text-ink-subtle">{help}</p>
      ) : null}
    </div>
  )
}
