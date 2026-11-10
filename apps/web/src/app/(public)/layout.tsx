import type { ReactNode } from 'react'
import Link from 'next/link'
import { getConfig } from '@/lib/content'
import { getNavigation } from '@/lib/site'

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { site } = getConfig()
  const { header, footer } = getNavigation()
  const year = new Date().getFullYear()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-4">
          <Link href="/" className="text-sm font-semibold tracking-wide text-[var(--color-text)]">
            {site.title}
          </Link>
          <nav className="flex items-center gap-1 text-sm text-[var(--color-text-muted)]">
            {header.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="rounded-md px-2.5 py-1.5 transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">{children}</main>

      <footer className="border-t border-[var(--color-border)] py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 text-xs text-[var(--color-text-subtle)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {site.footer?.since ?? year}
            {site.footer?.since && site.footer.since !== year ? `–${year}` : ''} {site.author || site.title}
            {site.footer?.text ? ` · ${site.footer.text}` : ''}
          </p>
          <div className="flex gap-3">
            {footer.map((item) => (
              <Link key={item.id} href={item.href} className="hover:text-[var(--color-text)]">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
