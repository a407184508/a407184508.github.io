import Link from 'next/link'
import { excerpt, formatDate, readingTime } from '@blog/core'
import { getConfig, getPosts, getTags } from '@/lib/content'
import { getExtensions } from '@/lib/site'

export default function HomePage() {
  const { site } = getConfig()
  const posts = getPosts()
  const tags = getTags().slice(0, 8)
  const extensions = getExtensions()

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{site.title}</h1>
        <p className="max-w-xl text-[var(--color-text-muted)]">{site.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {extensions.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">最新文章</h2>
          <Link href="/archive/" className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-accent)]">
            查看归档 →
          </Link>
        </div>

        {posts.length === 0 ? (
          <p className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] px-6 py-12 text-center text-sm text-[var(--color-text-muted)]">
            还没有已发布的文章。到工作区写第一篇吧。
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {posts.map((post) => (
              <li key={post.slug} className="py-5 first:pt-0">
                <Link href={`/posts/${post.slug}/`} className="group flex flex-col gap-2">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-lg font-semibold transition group-hover:text-[var(--color-accent)]">
                      {post.title}
                    </h3>
                    <span className="text-xs text-[var(--color-text-subtle)]">
                      {formatDate(post.date)} · {readingTime(post.content)} 分钟
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                    {post.summary || excerpt(post.content)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-[var(--color-surface-muted)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {tags.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">标签</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/tags/${tag.slug}/`}
                className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                {tag.displayName} · {tag.count}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
