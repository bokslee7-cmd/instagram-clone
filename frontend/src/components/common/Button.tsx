import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  isLoading?: boolean
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-sky-500 text-white hover:bg-sky-600 disabled:bg-sky-300',
  secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200',
  danger: 'bg-transparent text-red-500 hover:bg-red-50',
  ghost: 'bg-transparent text-neutral-900 hover:bg-neutral-100',
}

export function Button({
  variant = 'primary',
  isLoading,
  fullWidth,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner />}
      {children}
    </button>
  )
}
