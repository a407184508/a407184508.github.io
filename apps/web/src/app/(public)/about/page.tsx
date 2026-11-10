import type { Metadata } from 'next'
import { renderMarkdown } from '@blog/markdown'
import { getAbout } from '@/lib/content'

export const metadata: Metadata = {
  title: '关于',
  description: '关于本站点',
}

export default async function AboutPage() {
  const about = getAbout()
  if (!about) {
    return <p className="text-sm text-[var(--color-text-muted)]">尚未添加关于页面（content/pages/about.md）。</p>
  }
  const { html } = await renderMarkdown(about.content)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{about.title}</h1>
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
