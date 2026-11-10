import YAML from 'yaml'

export interface ParsedFrontmatter {
  data: Record<string, unknown>
  content: string
}

/** 解析 `---` 包裹的 YAML frontmatter。 */
export function parseFrontmatter(markdown: string): ParsedFrontmatter {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(markdown)
  if (!match) return { data: {}, content: markdown }
  const raw = match[1] ?? ''
  let data: Record<string, unknown> = {}
  try {
    const parsed: unknown = YAML.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      data = parsed as Record<string, unknown>
    }
  } catch {
    data = {}
  }
  return { data, content: markdown.slice(match[0].length) }
}

/** 生成 content/posts/*.md 的 frontmatter，字段顺序固定。 */
export function serializeFrontmatter(data: Record<string, unknown>): string {
  const ordered: Record<string, unknown> = {}
  for (const key of ['title', 'slug', 'date', 'summary', 'tags', 'cover', 'draft']) {
    if (data[key] !== undefined && data[key] !== null && data[key] !== '') ordered[key] = data[key]
  }
  for (const [key, value] of Object.entries(data)) {
    if (!(key in ordered) && value !== undefined && value !== null && value !== '') ordered[key] = value
  }
  return `---\n${YAML.stringify(ordered, { lineWidth: 0 })}---\n\n`
}

export function joinFrontmatter(data: Record<string, unknown>, content: string): string {
  return `${serializeFrontmatter(data)}${content.replace(/^\s*\n/, '')}`
}
