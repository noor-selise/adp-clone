import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-[var(--color-bg-inset)]', className)}
      {...props}
    />
  )
}

export { Skeleton }
