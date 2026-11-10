import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate } from '@blog/core'
import { getPostsByTagSlug, getTags } from '@/lib/content'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getTags().map((tag) => ({ slug: tag.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const tag = getTags().find((item) => item.slug === slug)
  if (!tag) return {}
  return {
    title: `标签：${tag.displayName}`,
    description: tag.description ?? `关于${tag.displayName}的文章`,
  }
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params
  const tag = getTags().find((item) => item.slug === slug)
  if (!tag) notFound()
  const posts = getPostsByTagSlug(slug)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 border-b border-[var(--color-border)] pb-5">
        <Link href="/tags/" className="text-xs text-[var(--color-text-subtle)] hover:text-[var(--color-accent)]">
          ← 全部标签
        </Link>
        <h1 className="text-2xl font-bold">{tag.displayName}</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {tag.description ?? `共 ${tag.count} 篇文章`}
        </p>
      </header>

      <ul className="flex flex-col divide-y divide-[var(--color-border)]">
        {posts.map((post) => (
          <li key={post.slug} className="py-4 first:pt-0">
            <Link href={`/posts/${post.slug}/`} className="flex flex-col gap-1 group">
              <span className="font-medium transition group-hover:text-[var(--color-accent)]">{post.title}</span>
              <span className="text-xs text-[var(--color-text-subtle)]">{formatDate(post.date)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
