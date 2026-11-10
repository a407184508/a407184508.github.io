import {
  ArticleSchema,
  ArticleFrontmatterSchema,
  excerpt,
  nowIso,
  slugFromTitle,
  toSlug,
  type Article,
} from '@blog/core'
import { joinFrontmatter, parseFrontmatter } from '@blog/markdown'
import { getDb } from './db'
import { crashKey, deleteSetting } from './settings'

export async function listArticles(): Promise<Article[]> {
  const rows = await getDb().articles.toArray()
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getArticle(id: string): Promise<Article | null> {
  return (await getDb().articles.get(id)) ?? null
}

export async function listSlugs(): Promise<string[]> {
  const rows = await getDb().articles.toArray()
  return rows.map((row) => row.slug)
}

export interface CreateArticleInput {
  title?: string
  content?: string
  tags?: string[]
}

export async function createArticle(input: CreateArticleInput = {}): Promise<Article> {
  const now = nowIso()
  const title = input.title?.trim() || '未命名文章'
  const slug = slugFromTitle(title === '未命名文章' ? toSlug(now, 'post') : title, await listSlugs())
  const article: Article = {
    id: crypto.randomUUID(),
    slug,
    title,
    summary: '',
    tags: input.tags ?? [],
    content: input.content ?? '',
    coverAssetId: null,
    date: now,
    status: 'draft',
    hasUnpublishedChanges: false,
    publishedAt: null,
    remotePath: null,
    lastPublishedHash: null,
    createdAt: now,
    updatedAt: now,
  }
  await getDb().articles.add(article)
  return article
}

export interface SaveArticlePatch {
  title?: string
  slug?: string
  summary?: string
  tags?: string[]
  content?: string
  coverAssetId?: string | null
  date?: string
}

export async function saveArticle(id: string, patch: SaveArticlePatch): Promise<Article> {
  const db = getDb()
  const existing = await db.articles.get(id)
  if (!existing) throw new Error('文章不存在')
  const updated: Article = {
    ...existing,
    ...patch,
    updatedAt: nowIso(),
    hasUnpublishedChanges:
      existing.status === 'published' &&
      (patch.content !== undefined || patch.title !== undefined || patch.summary !== undefined || patch.tags !== undefined),
  }
  const validated = ArticleSchema.parse(updated)
  await db.articles.put(validated)
  return validated
}

export async function deleteArticle(id: string): Promise<void> {
  const db = getDb()
  await db.transaction('rw', db.articles, db.publishJobs, db.settings, async () => {
    await db.articles.delete(id)
    await db.publishJobs.where('articleId').equals(id).delete()
    await db.settings.delete(crashKey(id))
  })
}

export async function duplicateArticle(id: string): Promise<Article | null> {
  const source = await getArticle(id)
  if (!source) return null
  const now = nowIso()
  const title = `${source.title}（副本）`
  const slug = slugFromTitle(`${source.slug}-copy`, await listSlugs())
  const copy: Article = {
    ...source,
    id: crypto.randomUUID(),
    title,
    slug,
    status: 'draft',
    hasUnpublishedChanges: false,
    publishedAt: null,
    remotePath: null,
    lastPublishedHash: null,
    createdAt: now,
    updatedAt: now,
  }
  await getDb().articles.add(copy)
  return copy
}

/** 导入单篇 Markdown：有 frontmatter 用其字段，否则从正文推断。 */
export async function importMarkdown(raw: string): Promise<Article> {
  const { data, content } = parseFrontmatter(raw)
  const parsed = ArticleFrontmatterSchema.safeParse(data)
  const heading = /^#\s+(.+)$/m.exec(content)?.[1]?.trim()
  const title = parsed.success ? parsed.data.title : (heading ?? '导入的文章')
  const now = nowIso()
  const slug = slugFromTitle(parsed.success ? parsed.data.slug : toSlug(title), await listSlugs())
  const article: Article = {
    id: crypto.randomUUID(),
    slug,
    title,
    summary: parsed.success ? parsed.data.summary : excerpt(content),
    tags: parsed.success ? parsed.data.tags : [],
    content,
    coverAssetId: null,
    date: parsed.success ? parsed.data.date : now,
    status: 'draft',
    hasUnpublishedChanges: false,
    publishedAt: null,
    remotePath: null,
    lastPublishedHash: null,
    createdAt: now,
    updatedAt: now,
  }
  await getDb().articles.add(article)
  return article
}

export function toMarkdownFile(article: Article, coverPath: string | null = null, content = article.content): string {
  return joinFrontmatter(
    {
      title: article.title,
      slug: article.slug,
      date: article.date,
      summary: article.summary,
      tags: article.tags,
      cover: coverPath,
    },
    content,
  )
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
