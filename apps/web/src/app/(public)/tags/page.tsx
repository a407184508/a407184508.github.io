import type { Metadata } from 'next'
import Link from 'next/link'
import { getTags } from '@/lib/content'

export const metadata: Metadata = {
  title: '标签',
  description: '按标签浏览文章',
}

export default function TagsPage() {
  const tags = getTags()
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">标签</h1>
      {tags.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">还没有标签。</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/tags/${tag.slug}/`}
              className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 text-sm transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: tag.color ?? 'var(--color-text-subtle)' }}
                aria-hidden
              />
              {tag.displayName}
              <span className="text-xs text-[var(--color-text-subtle)]">{tag.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
