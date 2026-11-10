import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { cache } from 'react'
import { ArticleFrontmatterSchema } from '@blog/core'
import { loadProjectConfig, type ProjectConfig } from '@blog/config/node'
import { ensureTagSlugs, resolveTags, type ResolvedTag } from '@blog/config'
import { parseFrontmatter } from '@blog/markdown'

export interface PostMeta {
  slug: string
  title: string
  date: string
  summary: string
  tags: string[]
  cover: string | null
}

export interface Post extends PostMeta {
  content: string
}

export function projectRoot(): string {
  return resolve(process.cwd(), '../..')
}

export const getConfig = cache((): ProjectConfig => loadProjectConfig(projectRoot()))

const getPostsInternal = cache((): Post[] => {
  const dir = join(projectRoot(), 'content', 'posts')
  let files: string[]
  try {
    files = readdirSync(dir).filter((file) => file.endsWith('.md'))
  } catch {
    return []
  }

  const posts: Post[] = []
  for (const file of files) {
    const raw = readFileSync(join(dir, file), 'utf8')
    const { data, content } = parseFrontmatter(raw)
    const parsed = ArticleFrontmatterSchema.safeParse(data)
    if (!parsed.success) {
      console.warn(`[content] ${file} frontmatter 校验失败：`, parsed.error.issues)
      continue
    }
    if (parsed.data.draft) continue
    posts.push({
      slug: parsed.data.slug,
      title: parsed.data.title,
      date: parsed.data.date,
      summary: parsed.data.summary,
      tags: parsed.data.tags,
      cover: parsed.data.cover ?? null,
      content,
    })
  }

  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

export function getPosts(): Post[] {
  return getPostsInternal()
}

export function getPost(slug: string): Post | null {
  return getPosts().find((post) => post.slug === slug) ?? null
}

export interface TagWithCount extends ResolvedTag {
  count: number
}

export const getTags = cache((): TagWithCount[] => {
  const config = getConfig()
  const posts = getPosts()
  const names = new Set<string>()
  for (const post of posts) {
    for (const tag of post.tags) names.add(tag)
  }
  const declared = resolveTags(config.tags.tags)
  const all = ensureTagSlugs([...names], declared)
  const meta = new Map(declared.map((tag) => [tag.name, tag]))
  const counts = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return all
    .map((tag, index) => {
      const declaredTag = meta.get(tag.name)
      return {
        name: tag.name,
        slug: tag.slug,
        displayName: declaredTag?.displayName ?? tag.name,
        color: declaredTag?.color,
        order: declaredTag?.order ?? index,
        group: declaredTag?.group,
        description: declaredTag?.description,
        count: counts.get(tag.name) ?? 0,
      }
    })
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count || a.order - b.order)
})

export function getPostsByTagSlug(slug: string): Post[] {
  const tag = getTags().find((item) => item.slug === slug)
  if (!tag) return []
  return getPosts().filter((post) => post.tags.includes(tag.name))
}

export interface ArchiveGroup {
  year: string
  posts: Post[]
}

export function getArchive(): ArchiveGroup[] {
  const groups = new Map<string, Post[]>()
  for (const post of getPosts()) {
    const year = new Date(post.date).getFullYear().toString()
    const list = groups.get(year) ?? []
    list.push(post)
    groups.set(year, list)
  }
  return [...groups.entries()]
    .map(([year, posts]) => ({ year, posts }))
    .sort((a, b) => Number(b.year) - Number(a.year))
}

export function getAbout(): { title: string; content: string } | null {
  try {
    const raw = readFileSync(join(projectRoot(), 'content', 'pages', 'about.md'), 'utf8')
    const { content } = parseFrontmatter(raw)
    return { title: '关于', content }
  } catch {
    return null
  }
}

export function absoluteUrl(path: string): string {
  const { site } = getConfig()
  const base = site.url.replace(/\/+$/, '')
  if (path.startsWith('http')) return path
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
