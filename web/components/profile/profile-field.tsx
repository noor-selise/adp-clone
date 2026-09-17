import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

const inputClassName =
  'w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:ring-offset-2'

type FieldProps = {
  label: string
  hint?: string
  children: ReactNode
}

export const ProfileField = ({ label, hint, children }: FieldProps) => (
  <label className="block space-y-1 text-sm">
    <span>{label}</span>
    {children}
    {hint ? <span className="block text-xs text-[var(--color-text-faint)]">{hint}</span> : null}
  </label>
)

type ProfileInputProps = InputHTMLAttributes<HTMLInputElement>

export const ProfileInput = ({ className, ...props }: ProfileInputProps) => (
  <input className={className ?? inputClassName} {...props} />
)

type ProfileTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export const ProfileTextarea = ({ className, ...props }: ProfileTextareaProps) => (
  <textarea className={className ?? `${inputClassName} min-h-24`} {...props} />
)

export const profileSectionClassName =
  'space-y-4 rounded-xl border border-[var(--color-border)] bg-white p-6'

export const profileAlertClassName = {
  error: 'rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800',
  success: 'rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800',
} as const
