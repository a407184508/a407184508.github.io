import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate, readingTime } from '@blog/core'
import { renderMarkdown } from '@blog/markdown'
import { absoluteUrl, getPost, getPosts, getTags } from '@/lib/content'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/posts/${post.slug}/` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      images: post.cover ? [post.cover] : undefined,
    },
  }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const { html } = await renderMarkdown(post.content)
  const tags = getTags()
  const postTags = post.tags
    .map((name) => tags.find((tag) => tag.name === name))
    .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-6">
        <h1 className="text-3xl font-bold leading-tight tracking-tight">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-subtle)]">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span>·</span>
          <span>{readingTime(post.content)} 分钟</span>
          {postTags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {postTags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/tags/${tag.slug}/`}
                  className="rounded bg-[var(--color-surface-muted)] px-2 py-0.5 text-[var(--color-text-muted)] transition hover:text-[var(--color-accent)]"
                >
                  {tag.displayName}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        {post.summary ? <p className="text-sm text-[var(--color-text-muted)]">{post.summary}</p> : null}
      </header>

      {post.cover ? (
        // 封面图来自仓库 public 目录，静态导出后由 Pages 直接提供
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.cover} alt={post.title} className="w-full rounded-[var(--radius)] border border-[var(--color-border)]" />
      ) : null}

      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />

      <footer className="flex items-center justify-between border-t border-[var(--color-border)] pt-5 text-xs text-[var(--color-text-subtle)]">
        <Link href="/" className="hover:text-[var(--color-accent)]">
          ← 返回首页
        </Link>
        <a href={absoluteUrl(`/posts/${post.slug}/`)} className="hover:text-[var(--color-accent)]">
          永久链接
        </a>
      </footer>
    </article>
  )
}
