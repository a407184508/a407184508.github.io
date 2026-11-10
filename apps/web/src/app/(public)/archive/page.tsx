import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDate } from '@blog/core'
import { getArchive } from '@/lib/content'

export const metadata: Metadata = {
  title: '归档',
  description: '按年份浏览全部文章',
}

export default function ArchivePage() {
  const groups = getArchive()
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">归档</h1>
      {groups.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">还没有文章。</p>
      ) : (
        groups.map((group) => (
          <section key={group.year} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-subtle)]">{group.year}</h2>
            <ul className="flex flex-col divide-y divide-[var(--color-border)]">
              {group.posts.map((post) => (
                <li key={post.slug} className="flex items-baseline gap-4 py-3 first:pt-0">
                  <span className="w-16 shrink-0 text-xs text-[var(--color-text-subtle)]">
                    {formatDate(post.date).slice(5)}
                  </span>
                  <Link
                    href={`/posts/${post.slug}/`}
                    className="text-sm font-medium transition hover:text-[var(--color-accent)]"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
