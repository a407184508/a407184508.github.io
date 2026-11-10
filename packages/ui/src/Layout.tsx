import type { ReactNode } from 'react'
import { cn } from './cn'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Empty({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-[var(--color-border)] px-6 py-14 text-center">
      <p className="text-base font-medium text-[var(--color-text)]">{title}</p>
      {description ? <p className="max-w-md text-sm text-[var(--color-text-muted)]">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  )
}
