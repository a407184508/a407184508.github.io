'use client'

import { useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@blog/ui'

const NAV = [
  { href: '/app/', label: '概览', exact: true },
  { href: '/app/articles/', label: '文章' },
  { href: '/app/tools/wechat/', label: '公众号排版' },
  { href: '/app/tools/longimage/', label: '长图导出' },
  { href: '/app/settings/', label: '设置' },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    if (navigator.storage?.persist) {
      void navigator.storage.persist()
    }
  }, [])

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-muted)]">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] md:flex">
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <Link href="/app/" className="text-sm font-semibold">
            Blog Studio
          </Link>
          <p className="mt-1 text-xs text-[var(--color-text-subtle)]">本地优先的创作工作区</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-[var(--radius)] px-3 py-2 text-sm transition',
                  active
                    ? 'bg-[var(--color-accent-soft)] font-medium text-[var(--color-accent)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-[var(--color-border)] p-3">
          <Link
            href="/"
            className="block rounded-[var(--radius)] px-3 py-2 text-xs text-[var(--color-text-subtle)] hover:bg-[var(--color-surface-muted)]"
          >
            ← 返回公开站点
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 md:px-6">
          <Link href="/app/" className="text-sm font-semibold md:hidden">
            Blog Studio
          </Link>
          <p className="hidden text-xs text-[var(--color-text-subtle)] md:block">
            所有数据只保存在本浏览器，不会自动上传
          </p>
          <Link
            href="/"
            className="rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition hover:text-[var(--color-text)]"
          >
            公开站点
          </Link>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
        <nav className="flex overflow-x-auto border-t border-[var(--color-border)] bg-[var(--color-surface)] p-2 md:hidden">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap rounded-[var(--radius)] px-3 py-2 text-xs',
                  active ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]',
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
